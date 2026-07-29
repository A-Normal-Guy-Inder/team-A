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
        prev_status: { type: String, enum: [...ASSIGNABLE_TASK_STATUSES, null], default: null },
        status: { type: String, enum: TASK_STATUSES, default: TASK_STATUS.OPEN },
        category: { type: String, required: true, trim: true, maxlength: 60 },
        picture: { type: String, default: null },
        picture_public_id: { type: String, default: null },
        closed_at: { type: Date, default: null },
    },
    { timestamps: true, _id: false }
);

taskSchema.index({ user_id: 1, createdAt: -1 });
taskSchema.index({ status: 1, createdAt: -1 });
taskSchema.index({ status: 1, category: 1, createdAt: -1 });
taskSchema.index({ status: 1, end_time: 1 });
taskSchema.index({ status: 1, start_time: 1 });

taskSchema.statics.LIST_FIELDS =
    "title description location picture status start_time end_time category user_id createdAt";

module.exports = mongoose.model("Task", taskSchema);
