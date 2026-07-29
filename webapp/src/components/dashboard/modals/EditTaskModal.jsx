import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CATEGORIES } from "../../../constants/categories";
import { fetchFeed, fetchMyTasks, selectTasksSaving, updateTask } from "../../../features/tasks/tasksSlice";
import { validateTaskForm } from "../../../utils/validation";
import { toDateTimeLocal } from "../../../utils/datetime";

const EditTaskModal = ({ task, onClose }) => {
    const dispatch = useDispatch();
    const saving = useSelector(selectTasksSaving);

    const [form, setForm] = useState(() => ({
        title: task.title || "",
        category: task.category || "",
        description: task.description || "",
        location: task.location || "",
        // Stored as UTC ISO, displayed in the user's own timezone.
        startDate: toDateTimeLocal(task.start_time),
        endDate: toDateTimeLocal(task.end_time),
        newImage: null,
    }));

    useEffect(() => {
        setForm({
            title: task.title || "",
            category: task.category || "",
            description: task.description || "",
            location: task.location || "",
            startDate: toDateTimeLocal(task.start_time),
            endDate: toDateTimeLocal(task.end_time),
            newImage: null,
        });
    }, [task]);

    const setField = useCallback((field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = useCallback(async () => {
        const error = validateTaskForm(form, "edit");
        if (error) {
            toast.error(error);
            return;
        }

        const formData = new FormData();
        formData.append("title", form.title.trim());
        formData.append("category", form.category);
        formData.append("description", form.description.trim());
        formData.append("location", form.location.trim());
        formData.append("start_time", form.startDate);
        formData.append("end_time", form.endDate);
        if (form.newImage) formData.append("picture", form.newImage);

        const result = await dispatch(updateTask({ taskId: task._id, formData }));

        if (updateTask.rejected.match(result)) {
            toast.error(result.payload);
            return;
        }

        toast.success("Task updated successfully ✏️");
        onClose();
        // Refresh only the lists an edit can actually change.
        dispatch(fetchMyTasks());
        dispatch(fetchFeed());
    }, [dispatch, form, onClose, task._id]);

    return (
        <div className="modal-overlay">
            <div className="modal edit-modal">
                <h2>Edit Task</h2>

                <label>Title <span className="required">*</span></label>
                <input
                    type="text"
                    maxLength={120}
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                />

                <div className="form-group">
                    <label>Category <span className="required">*</span></label>
                    <div className="select-wrapper">
                        <select
                            value={form.category}
                            onChange={(e) => setField("category", e.target.value)}
                            required
                        >
                            <option value="">Select Category</option>
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <label>Description</label>
                <textarea
                    maxLength={2000}
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                />

                <label>Location <span className="required">*</span></label>
                <input
                    type="text"
                    maxLength={150}
                    value={form.location}
                    onChange={(e) => setField("location", e.target.value)}
                />

                <label>Start Date &amp; Time <span className="required">*</span></label>
                <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setField("startDate", e.target.value)}
                />

                <label>End Date &amp; Time <span className="required">*</span></label>
                <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setField("endDate", e.target.value)}
                />

                <label>Change Image</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setField("newImage", e.target.files[0])}
                />

                <div className="modal-actions">
                    <button onClick={handleSubmit} disabled={saving}>
                        {saving ? "Updating..." : "Update"}
                    </button>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default EditTaskModal;
