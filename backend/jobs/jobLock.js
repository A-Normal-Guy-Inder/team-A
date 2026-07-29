const crypto = require("crypto");
const JobLock = require("../models/jobLock.model");
const env = require("../config/env");

const INSTANCE_ID = `${process.pid}-${crypto.randomBytes(6).toString("hex")}`;

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
        if (err?.code === 11000) return false;
        console.error(`[jobs] Failed to acquire lock for ${jobName}:`, err.message);
        return false;
    }
}

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

// Never release early
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
