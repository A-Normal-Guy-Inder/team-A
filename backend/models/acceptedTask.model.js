const mongoose = require("mongoose");
const { ACCEPTED_TASK_STATUS, ACCEPTED_TASK_STATUSES } = require("../config/constants");

const acceptedTaskSchema = new mongoose.Schema(
    {
        user_id: { type: String, ref: "User", required: true },
        task_id: { type: String, ref: "Task", required: true },
        request_id: { type: mongoose.Schema.Types.ObjectId, ref: "Requests", default: null },
        status: {
            type: String,
            enum: ACCEPTED_TASK_STATUSES,
            default: ACCEPTED_TASK_STATUS.ACCEPTED,
        },
    },
    { timestamps: true }
);

// A task is assigned to exactly one helper — the one-to-one guarantee the whole
// request workflow is built around, enforced at the storage layer.
acceptedTaskSchema.index({ task_id: 1 }, { unique: true });
acceptedTaskSchema.index({ user_id: 1, createdAt: -1 });

module.exports = mongoose.model("AcceptedTasks", acceptedTaskSchema);
