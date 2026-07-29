const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema(
    {
        _id: { type: String, default: uuidv4 },
        first_name: { type: String, required: true, trim: true, maxlength: 50 },
        last_name: { type: String, required: true, trim: true, maxlength: 50 },
        phone_number: { type: String, required: true, trim: true },
        email_id: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        pending_email: { type: String, default: null, trim: true, lowercase: true },
        password: { type: String, required: true, select: false },
        last_password_change: { type: Date, default: Date.now },
        profile_picture: { type: String, default: null },
        profile_picture_public_id: { type: String, default: null },
        otp_hash: { type: String, default: null, select: false },
        otp_expires_at: { type: Date, default: null },
        otp_attempts: { type: Number, default: 0 },
        otp_blocked_time: { type: Date, default: null },
        // Which flow issued the outstanding OTP. Without this an OTP minted for
        // account verification could be replayed to authorise a password reset.
        otp_purpose: {
            type: String,
            enum: ["account_verification", "password_reset", "email_change", null],
            default: null,
        },
        // Short-lived grant written only after a password-reset OTP is verified.
        // `POST /auth/reset-password` requires it, which closes the hole where
        // any known email address could have its password overwritten.
        password_reset_expires_at: { type: Date, default: null },
        password_is_verified: { type: Boolean, default: true },
        password_verified_at: { type: Date, default: Date.now },
        is_verified: { type: Boolean, default: false },
    },
    { timestamps: true, _id: false }
);

// Uniqueness is declared once, here — declaring `unique` on the path *and* an
// explicit index duplicates the index and makes Mongoose warn at boot.
userSchema.index({ email_id: 1 }, { unique: true });
userSchema.index({ phone_number: 1 }, { unique: true });

/** Fields safe to serialise to the client. */
userSchema.statics.PUBLIC_FIELDS = "_id first_name last_name email_id phone_number profile_picture is_verified createdAt";
/** Minimal projection used when embedding an author inside another document. */
userSchema.statics.AUTHOR_FIELDS = "_id first_name last_name profile_picture";

userSchema.methods.toPublicJSON = function toPublicJSON() {
    return {
        _id: this._id,
        first_name: this.first_name,
        last_name: this.last_name,
        email_id: this.email_id,
        phone_number: this.phone_number,
        profile_picture: this.profile_picture,
        is_verified: this.is_verified,
    };
};

module.exports = mongoose.model("User", userSchema);
