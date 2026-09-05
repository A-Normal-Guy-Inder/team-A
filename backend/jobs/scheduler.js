const cron = require("node-cron");
const env = require("../config/env");
const { JOB_NAME, autoCloseExpiredTasks } = require("./autoCloseTasks.job");

const scheduledTasks = [];

async function runAutoClose() {
    try {
        const closed = await autoCloseExpiredTasks();
        if (closed > 0) {
            console.log(`[cron] Closed ${closed} expired task(s)`);
        }
    } catch (err) {
        console.error("[cron] Auto close task error:", err);
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

    /* node-cron reads this itself; only "true"/"false" are accepted */
    process.env.NODE_CRON_RUN = String(env.jobs.run);

    const task = cron.schedule(env.jobs.autoCloseSchedule, runAutoClose, {
        // Name forms the coordination key
        name: JOB_NAME,
        timezone: env.jobs.timezone,
        distributed: true,
        noOverlap: true,
    });

    if (!env.isProduction) {
        task.on("execution:overlap", () =>
            console.log("[cron] auto-close skipped — previous run still going")
        );
        task.on("execution:skipped", (context) =>
            console.log(`[cron] auto-close skipped — ${context.reason}`)
        );
    }

    scheduledTasks.push(task);
    console.log(
        `[cron] Scheduler started (NODE_CRON_RUN=${env.jobs.run}, "${env.jobs.autoCloseSchedule}")`
    );
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

module.exports = { startScheduler, stopScheduler };
