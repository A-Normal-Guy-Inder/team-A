const cron = require("node-cron");
const env = require("../config/env");
const { withLock, INSTANCE_ID } = require("./jobLock");
const { JOB_NAME, autoCloseExpiredTasks } = require("./autoCloseTasks.job");

const scheduledTasks = [];

/**
 * Guards against a slow run overlapping the next tick *within* this process.
 * The database lease handles the cross-instance case; this handles the local
 * one, which a lock alone would not (the same instance can re-acquire).
 */
let autoCloseRunning = false;

async function runAutoClose() {
    if (autoCloseRunning) return;
    autoCloseRunning = true;

    try {
        const ran = await withLock(JOB_NAME, async () => {
            const closed = await autoCloseExpiredTasks();
            if (closed > 0) {
                console.log(`[cron] Closed ${closed} expired task(s)`);
            }
        });

        if (!ran && !env.isProduction) {
            console.log("[cron] auto-close skipped — lock held by another instance");
        }
    } catch (err) {
        console.error("[cron] Auto close task error:", err);
    } finally {
        autoCloseRunning = false;
    }
}

/**
 * Starts the background jobs.
 *
 * Kept out of `connectDB` on purpose: connecting to a database and scheduling
 * work are unrelated concerns, and mixing them meant every process that merely
 * imported the db config also started a cron.
 */
function startScheduler() {
    if (!env.jobs.enabled) {
        console.log("[cron] Scheduler disabled (CRON_ENABLED=false)");
        return;
    }

    if (!cron.validate(env.jobs.autoCloseSchedule)) {
        console.error(`[cron] Invalid schedule expression: ${env.jobs.autoCloseSchedule}`);
        return;
    }

    const task = cron.schedule(env.jobs.autoCloseSchedule, runAutoClose, {
        timezone: env.jobs.timezone,
    });

    scheduledTasks.push(task);
    console.log(`[cron] Scheduler started (instance ${INSTANCE_ID}, "${env.jobs.autoCloseSchedule}")`);
}

async function stopScheduler() {
    for (const task of scheduledTasks) {
        try {
            await task.stop();
        } catch {
            /* already stopped */
        }
    }
    scheduledTasks.length = 0;
    // The lease is deliberately *not* released here: it expires within one
    // schedule interval, and handing it back early would let a surviving
    // instance run the same tick a second time.
}

module.exports = { startScheduler, stopScheduler, runAutoClose };
