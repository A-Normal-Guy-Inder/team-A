const mongoose = require("mongoose");

const jobLockSchema = new mongoose.Schema(
    {
        _id: { type: String },
        owner: { type: String, required: true },
        expires_at: { type: Date, required: true },
        last_run_at: { type: Date, default: null },
    },
    { timestamps: true, _id: false, versionKey: false }
);

jobLockSchema.index({ expires_at: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model("JobLock", jobLockSchema);
