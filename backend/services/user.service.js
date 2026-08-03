const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");
const { issueOtp, remainingCooldownMs } = require("../utils/otp");
const { sendEmailChangeWarning, sendEmailChangedNotice } = require("../utils/mailer");
const { OTP_PURPOSE, normaliseEmail, hashPassword, consumeOtp } = require("./auth.service");

function assertRecentReverification(user) {
    const verifiedAt = user.password_verified_at ? new Date(user.password_verified_at).getTime() : 0;
    if (!verifiedAt || Date.now() - verifiedAt > env.security.passwordReverifyWindowMs) {
        throw ApiError.forbidden("Please reverify your password before changing your email");
    }
}

async function getProfile(userId) {
    const user = await User.findById(userId).select(User.PUBLIC_FIELDS).lean();
    if (!user) throw ApiError.notFound("User not found");
    return user;
}

/*
 * Uploads `file` and points the document at it, in memory only. Hands back the
 * public id it displaced so the caller can drop that from Cloudinary — but only
 * after the save has gone through, since a failed save has to leave the old
 * image exactly where it was.
 */
async function attachPicture(user, file) {
    const image = await uploadToCloudinary(file.path, "profile_pictures").catch((err) => {
        throw ApiError.badRequest(err.message || "Failed to upload the profile picture");
    });

    const previousPublicId = user.profile_picture_public_id;

    user.profile_picture = image.secure_url;
    user.profile_picture_public_id = image.public_id;

    return { image, previousPublicId };
}

async function updateProfile(userId, payload, file) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    const swap = file ? await attachPicture(user, file) : null;

    if (payload.first_name !== undefined) user.first_name = payload.first_name;
    if (payload.last_name !== undefined) user.last_name = payload.last_name;
    if (payload.phone_number !== undefined) user.phone_number = payload.phone_number;
    // An empty string is a real value here — it is how the field is cleared.
    if (payload.bio !== undefined) user.bio = String(payload.bio).trim();

    try {
        await user.save();
    } catch (err) {
        await deleteFromCloudinary(swap?.image.public_id);
        throw err;
    }

    if (swap?.previousPublicId && swap.previousPublicId !== swap.image.public_id) {
        await deleteFromCloudinary(swap.previousPublicId);
    }

    return { user: user.toPublicJSON(), message: "Profile updated successfully" };
}

/*
 * Sets the profile picture on its own, as the mirror image of
 * removeProfilePicture below. The picture is no longer part of what the profile
 * form saves, so choosing a file takes effect there and then and the two
 * controls beside each other behave the same way.
 */
async function uploadProfilePicture(userId, file) {
    if (!file) throw ApiError.badRequest("Please choose an image to upload.");

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    const { image, previousPublicId } = await attachPicture(user, file);

    try {
        await user.save();
    } catch (err) {
        await deleteFromCloudinary(image.public_id);
        throw err;
    }

    if (previousPublicId && previousPublicId !== image.public_id) {
        await deleteFromCloudinary(previousPublicId);
    }

    return { user: user.toPublicJSON(), message: "Profile picture updated" };
}

/*
 * Drops the profile picture.
 *
 * The Cloudinary object goes only after the document has been saved without it:
 * if the remote delete fails the user still has no picture, which is what they
 * asked for. Doing it the other way round could leave the field pointing at an
 * image that no longer exists.
 */
async function removeProfilePicture(userId) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    if (!user.profile_picture && !user.profile_picture_public_id) {
        throw ApiError.badRequest("There is no profile picture to remove.");
    }

    const publicId = user.profile_picture_public_id;

    user.profile_picture = null;
    user.profile_picture_public_id = null;
    await user.save();

    await deleteFromCloudinary(publicId);

    return { user: user.toPublicJSON(), message: "Profile picture removed" };
}

async function reverifyPassword(password, userId) {
    const user = await User.findById(userId).select("+password");
    if (!user) throw ApiError.notFound("User not found");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw ApiError.badRequest("Invalid password");

    user.password_verified_at = new Date();
    user.password_is_verified = true;
    await user.save();

    const minutes = Math.round(env.security.passwordReverifyWindowMs / 60000);
    return { message: `Password verified successfully (valid for ${minutes} minutes)` };
}

async function sendChangeEmailOtp(newEmailRaw, userId) {
    const user = await User.findById(userId).select("+otp_hash");
    if (!user) throw ApiError.notFound("User not found");

    assertRecentReverification(user);

    const newEmail = normaliseEmail(newEmailRaw);
    if (newEmail === normaliseEmail(user.email_id)) {
        throw ApiError.badRequest("New email cannot be the same as your current email.");
    }

    const taken = await User.exists({ email_id: newEmail });
    if (taken) {
        throw ApiError.conflict("Email already in use for another account. Please use a different email.");
    }

    const previousEmail = user.email_id;

    user.pending_email = newEmail;
    await user.save();

    await issueOtp(user, { purpose: OTP_PURPOSE.EMAIL_CHANGE, email: newEmail });

    /*
     * The code went to the new address, so the old one — the only address the
     * real owner is guaranteed to hold — would otherwise learn nothing about an
     * attempt to move the account away from them.
     */
    await sendEmailChangeWarning(previousEmail, newEmail);

    return { message: "OTP sent to new email address" };
}

async function verifyChangeEmailOtp(otp, userId) {
    const user = await User.findById(userId).select("+otp_hash");
    if (!user) throw ApiError.notFound("User not found");
    if (!user.pending_email) throw ApiError.badRequest("No email change request found");

    assertRecentReverification(user);
    await consumeOtp(user, otp, OTP_PURPOSE.EMAIL_CHANGE);

    const taken = await User.exists({ email_id: user.pending_email, _id: { $ne: user._id } });
    if (taken) {
        user.pending_email = null;
        await user.save();
        throw ApiError.conflict("Email already in use for another account. Please use a different email.");
    }

    const previousEmail = user.email_id;

    user.email_id = user.pending_email;
    user.pending_email = null;
    user.password_is_verified = false;
    user.password_verified_at = null;

    await user.save();

    // Last message the old address will ever get from us — it is no longer on
    // the account, so it has to be told the change actually went through.
    await sendEmailChangedNotice(previousEmail, user.email_id);

    return { message: "Email updated successfully", user: user.toPublicJSON() };
}

async function resendChangeEmailOtp(userId) {
    const user = await User.findById(userId).select("+otp_hash");
    if (!user) throw ApiError.notFound("User not found");
    if (!user.pending_email) throw ApiError.badRequest("No email change request found");

    assertRecentReverification(user);

    const cooldown = remainingCooldownMs(user);
    if (cooldown > 0) {
        throw ApiError.tooManyRequests(
            `Please wait ${Math.ceil(cooldown / 1000)}s before requesting another OTP`
        );
    }

    await issueOtp(user, { purpose: OTP_PURPOSE.EMAIL_CHANGE, email: user.pending_email });

    return { message: "OTP resent successfully" };
}

/*
 * Both directions ask for the password. Turning 2FA *off* is the one that
 * matters — a hijacked session that could quietly disable it would make the
 * feature decorative — but requiring it symmetrically keeps the UI honest.
 */
async function setTwoFactor(userId, { enabled, password }) {
    const user = await User.findById(userId).select("+password");
    if (!user) throw ApiError.notFound("User not found");

    const valid = await bcrypt.compare(String(password), user.password);
    if (!valid) throw ApiError.badRequest("Password is incorrect.");

    const next = enabled === true || enabled === "true";
    user.two_factor_enabled = next;
    // A stale pending window must not survive the setting being turned off.
    if (!next) user.two_factor_pending_until = null;
    await user.save();

    return {
        message: next
            ? "Two-factor authentication enabled."
            : "Two-factor authentication disabled.",
        user: user.toPublicJSON(),
    };
}

async function changePassword(userId, { current_password, new_password }) {
    const user = await User.findById(userId).select("+password");
    if (!user) throw ApiError.notFound("User not found");

    const valid = await bcrypt.compare(current_password, user.password);
    if (!valid) throw ApiError.badRequest("Current Password is incorrect.");

    user.password = await hashPassword(new_password);
    user.last_password_change = new Date();
    user.password_verified_at = new Date();
    user.password_is_verified = true;
    await user.save();

    const token = jwt.sign({ userId: user._id }, env.jwtSecret, { expiresIn: env.jwtShortExpiry });

    return { message: "Password changed successfully.", token, maxAge: env.shortSessionMs };
}

module.exports = {
    getProfile,
    updateProfile,
    uploadProfilePicture,
    removeProfilePicture,
    reverifyPassword,
    sendChangeEmailOtp,
    verifyChangeEmailOtp,
    resendChangeEmailOtp,
    setTwoFactor,
    changePassword,
};
