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

// --- Indexes -----------------------------------------------------------------
// One live request per (task, requester). Enforced in the database rather than
// by a read-then-write check, which races under concurrency.
requestSchema.index({ task_id: 1, requester_id: 1 }, { unique: true });
// "My Requests" list.
requestSchema.index({ requester_id: 1, createdAt: -1 });
// Sibling auto-rejection when a request is accepted.
requestSchema.index({ task_id: 1, status: 1 });
// "Requests received" list is driven by task ownership, then sorted by recency.
requestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Requests", requestSchema);
