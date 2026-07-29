const mongoose = require("mongoose");

/**
 * Lease-based lock used to keep scheduled jobs single-run when the API is
 * deployed on more than one instance. MongoDB is already a dependency, so the
 * lock needs no extra infrastructure.
 */
const jobLockSchema = new mongoose.Schema(
    {
        _id: { type: String }, // job name
        owner: { type: String, required: true }, // instance id holding the lease
        expires_at: { type: Date, required: true },
        last_run_at: { type: Date, default: null },
    },
    { timestamps: true, _id: false, versionKey: false }
);

// Expired leases are reclaimed by the acquire query itself; the TTL index is
// only housekeeping so abandoned documents do not linger forever.
jobLockSchema.index({ expires_at: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model("JobLock", jobLockSchema);
