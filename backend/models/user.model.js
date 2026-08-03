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
        bio: { type: String, default: "", trim: true, maxlength: 500 },
        password: { type: String, required: true, select: false },
        last_password_change: { type: Date, default: Date.now },
        profile_picture: { type: String, default: null },
        profile_picture_public_id: { type: String, default: null },
        otp_hash: { type: String, default: null, select: false },
        otp_expires_at: { type: Date, default: null },
        otp_attempts: { type: Number, default: 0 },
        otp_last_attempt_at: { type: Date, default: null },
        otp_blocked_time: { type: Date, default: null },
        otp_purpose: {
            type: String,
            enum: ["account_verification", "password_reset", "email_change", "two_factor", null],
            default: null,
        },
        /*
         * Tokens issued before this instant are refused. Logging out stamps it,
         * which is what makes a logout invalidate the token rather than merely
         * deleting the browser's copy of it.
         */
        sessions_valid_from: { type: Date, default: null },
        two_factor_enabled: { type: Boolean, default: false },
        // Set once a login clears the password check, so a second factor can only
        // be redeemed by someone who already passed the first one.
        two_factor_pending_until: { type: Date, default: null },
        login_attempts: { type: Number, default: 0 },
        login_last_attempt_at: { type: Date, default: null },
        login_blocked_until: { type: Date, default: null },
        password_reset_expires_at: { type: Date, default: null },
        password_is_verified: { type: Boolean, default: true },
        password_verified_at: { type: Date, default: Date.now },
        is_verified: { type: Boolean, default: false },
    },
    { timestamps: true, _id: false }
);

userSchema.index({ email_id: 1 }, { unique: true });
userSchema.index({ phone_number: 1 }, { unique: true });

userSchema.statics.PUBLIC_FIELDS = "_id first_name last_name email_id phone_number profile_picture bio is_verified two_factor_enabled createdAt";
userSchema.statics.AUTHOR_FIELDS = "_id first_name last_name profile_picture bio";

userSchema.methods.toPublicJSON = function toPublicJSON() {
    return {
        _id: this._id,
        first_name: this.first_name,
        last_name: this.last_name,
        email_id: this.email_id,
        phone_number: this.phone_number,
        profile_picture: this.profile_picture,
        bio: this.bio || "",
        is_verified: this.is_verified,
        two_factor_enabled: Boolean(this.two_factor_enabled),
    };
};

module.exports = mongoose.model("User", userSchema);
