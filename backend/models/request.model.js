const mongoose = require("mongoose");
const { REQUEST_STATUS, REQUEST_STATUSES } = require("../config/constants");

const requestSchema = new mongoose.Schema(
    {
        task_id: { type: String, ref: "Task", required: true },
        requester_id: { type: String, ref: "User", required: true },
        status: { type: String, enum: REQUEST_STATUSES, default: REQUEST_STATUS.PENDING },
        description: { type: String, default: "", trim: true, maxlength: 1000 },
        rejectedAt: { type: Date, default: null },
        resolvedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

requestSchema.index({ task_id: 1, requester_id: 1 }, { unique: true });
requestSchema.index({ requester_id: 1, createdAt: -1 });
requestSchema.index({ task_id: 1, status: 1 });
requestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Requests", requestSchema);
