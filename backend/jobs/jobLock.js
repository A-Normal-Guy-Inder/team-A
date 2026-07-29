const crypto = require("crypto");
const JobLock = require("../models/jobLock.model");
const env = require("../config/env");

/**
 * Identifies this process. Regenerated on every boot, which is exactly what we
 * want: a restarted instance must not be able to reclaim a lease it "owned"
 * before the crash without going through the expiry check.
 */
const INSTANCE_ID = `${process.pid}-${crypto.randomBytes(6).toString("hex")}`;

/**
 * Attempts to take the lease for `jobName`.
 *
 * The whole acquisition is a single atomic `findOneAndUpdate`: the document is
 * only written when it does not exist yet or its lease has already expired.
 * Two instances firing the same cron tick therefore cannot both win — the
 * second one's filter matches nothing.
 */
async function acquireLock(jobName, ttlMs = env.jobs.lockTtlMs) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);

    try {
        const result = await JobLock.findOneAndUpdate(
            { _id: jobName, expires_at: { $lte: now } },
            { $set: { owner: INSTANCE_ID, expires_at: expiresAt, last_run_at: now } },
            { new: true, upsert: true, includeResultMetadata: false }
        );
        return result?.owner === INSTANCE_ID;
    } catch (err) {
        // A duplicate-key error means another instance inserted the lock
        // between our filter and the upsert — it won, we simply skip this tick.
        if (err?.code === 11000) return false;
        console.error(`[jobs] Failed to acquire lock for ${jobName}:`, err.message);
        return false;
    }
}

/** Releases the lease early so the next tick is not delayed by a full TTL. */
async function releaseLock(jobName) {
    try {
        await JobLock.updateOne(
            { _id: jobName, owner: INSTANCE_ID },
            { $set: { expires_at: new Date() } }
        );
    } catch (err) {
        console.error(`[jobs] Failed to release lock for ${jobName}:`, err.message);
    }
}

/**
 * Runs `task` only if this instance wins the lease for `jobName`.
 * Returns `false` when the run was skipped.
 *
 * `release` defaults to **false** for periodic jobs. Releasing the lease as
 * soon as the work finishes would reopen the window: a second instance whose
 * cron fired on the same tick, but a few milliseconds later, would then acquire
 * the freed lock and run the job again. Letting the lease expire on its own —
 * with a TTL just under the schedule interval — is what actually guarantees one
 * run per tick.
 */
async function withLock(jobName, task, { ttlMs, release = false } = {}) {
    const acquired = await acquireLock(jobName, ttlMs);
    if (!acquired) return false;

    try {
        await task();
        return true;
    } finally {
        if (release) await releaseLock(jobName);
    }
}

module.exports = { INSTANCE_ID, acquireLock, releaseLock, withLock };
