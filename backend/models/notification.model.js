const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        user_id: { type: String, ref: "User", required: true },
        message: { type: String, required: true, trim: true, maxlength: 500 },
        read: { type: Boolean, default: false },
        type: { type: String, default: "general" },
        reference_id: { type: String, default: null },
    },
    { timestamps: true }
);

notificationSchema.index({ user_id: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user_id: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
