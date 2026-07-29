const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { TASK_STATUS, TASK_STATUSES, ASSIGNABLE_TASK_STATUSES } = require("../config/constants");

const taskSchema = new mongoose.Schema(
    {
        _id: { type: String, default: uuidv4 },
        user_id: { type: String, ref: "User", required: true },
        title: { type: String, required: true, trim: true, maxlength: 120 },
        description: { type: String, default: "", trim: true, maxlength: 2000 },
        location: { type: String, required: true, trim: true, maxlength: 150 },
        start_time: { type: Date, required: true },
        end_time: { type: Date, required: true },
        // Remembers whether the task was open or already assigned before it was
        // auto-closed, so re-opening it (via an edit) restores the right state.
        prev_status: { type: String, enum: [...ASSIGNABLE_TASK_STATUSES, null], default: null },
        status: { type: String, enum: TASK_STATUSES, default: TASK_STATUS.OPEN },
        category: { type: String, required: true, trim: true, maxlength: 60 },
        picture: { type: String, default: null },
        picture_public_id: { type: String, default: null },
        closed_at: { type: Date, default: null },
    },
    { timestamps: true, _id: false }
);

// --- Indexes -----------------------------------------------------------------
// "My Tasks" list: owner + newest first (and the default sort tie-breaker).
taskSchema.index({ user_id: 1, createdAt: -1 });
// Feed: open tasks, newest first.
taskSchema.index({ status: 1, createdAt: -1 });
// Feed filtered by category, and category facet counts.
taskSchema.index({ status: 1, category: 1, createdAt: -1 });
// Auto-close cron: expired, not-yet-closed tasks.
taskSchema.index({ status: 1, end_time: 1 });
// Sorting the feed by start time (soonest first).
taskSchema.index({ status: 1, start_time: 1 });

taskSchema.statics.LIST_FIELDS =
    "title description location picture status start_time end_time category user_id createdAt";

module.exports = mongoose.model("Task", taskSchema);
