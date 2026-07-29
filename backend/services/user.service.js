const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");
const { issueOtp, remainingCooldownMs } = require("../utils/otp");
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

async function updateProfile(userId, payload, file) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    let image = null;
    if (file) {
        image = await uploadToCloudinary(file.path, "profile_pictures").catch((err) => {
            throw ApiError.badRequest(err.message || "Failed to upload the profile picture");
        });
    }

    const previousPublicId = user.profile_picture_public_id;

    if (payload.first_name !== undefined) user.first_name = payload.first_name;
    if (payload.last_name !== undefined) user.last_name = payload.last_name;
    if (payload.phone_number !== undefined) user.phone_number = payload.phone_number;

    if (image) {
        user.profile_picture = image.secure_url;
        user.profile_picture_public_id = image.public_id;
    }

    try {
        await user.save();
    } catch (err) {
        await deleteFromCloudinary(image?.public_id);
        throw err;
    }

    if (image && previousPublicId && previousPublicId !== image.public_id) {
        await deleteFromCloudinary(previousPublicId);
    }

    return { user: user.toPublicJSON(), message: "Profile updated successfully" };
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

    user.pending_email = newEmail;
    await user.save();

    await issueOtp(user, { purpose: OTP_PURPOSE.EMAIL_CHANGE, email: newEmail });

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

    user.email_id = user.pending_email;
    user.pending_email = null;
    user.password_is_verified = false;
    user.password_verified_at = null;

    await user.save();

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
    reverifyPassword,
    sendChangeEmailOtp,
    verifyChangeEmailOtp,
    resendChangeEmailOtp,
    changePassword,
};
