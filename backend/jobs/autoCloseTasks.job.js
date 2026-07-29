const Task = require("../models/task.model");
const { TASK_STATUS } = require("../config/constants");

const JOB_NAME = "auto-close-tasks";

/**
 * Closes every task whose end time has passed.
 *
 * This runs as an *aggregation pipeline update* rather than a plain `$set`.
 * The previous implementation wrote `prev_status: "$status"`, which stores the
 * literal seven-character string `"$status"` — field paths are only resolved
 * inside a pipeline. Every closed task therefore lost the information needed to
 * restore it, and `prev_status` failed schema validation on the next save.
 */
async function autoCloseExpiredTasks(now = new Date()) {
    const result = await Task.updateMany(
        {
            end_time: { $lt: now },
            status: { $ne: TASK_STATUS.CLOSED },
        },
        [
            {
                $set: {
                    prev_status: "$status",
                    status: TASK_STATUS.CLOSED,
                    closed_at: now,
                },
            },
        ],
        // Mongoose refuses an array update unless the intent is stated
        // explicitly, which guards against passing one by accident.
        { updatePipeline: true }
    );

    return result.modifiedCount || 0;
}

module.exports = { JOB_NAME, autoCloseExpiredTasks };
