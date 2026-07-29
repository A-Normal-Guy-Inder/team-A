const Task = require("../models/task.model");
const { TASK_STATUS } = require("../config/constants");

const JOB_NAME = "auto-close-tasks";

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
        { updatePipeline: true }
    );

    return result.modifiedCount || 0;
}

module.exports = { JOB_NAME, autoCloseExpiredTasks };
