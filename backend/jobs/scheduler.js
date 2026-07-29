const cron = require("node-cron");
const env = require("../config/env");
const { withLock, INSTANCE_ID } = require("./jobLock");
const { JOB_NAME, autoCloseExpiredTasks } = require("./autoCloseTasks.job");

const scheduledTasks = [];

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
        }
    }
    scheduledTasks.length = 0;
}

module.exports = { startScheduler, stopScheduler, runAutoClose };
