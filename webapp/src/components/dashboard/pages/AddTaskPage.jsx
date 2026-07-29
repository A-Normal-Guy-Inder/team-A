import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import ImageUploadField from "../ImageUploadField";
import { CATEGORIES } from "../../../constants/categories";
import { createTask, fetchMyTasks, selectTasksSaving } from "../../../features/tasks/tasksSlice";
import { setActivePage } from "../../../features/ui/uiSlice";
import { validateTaskForm } from "../../../utils/validation";
import { nowForInput } from "../../../utils/datetime";

const EMPTY_FORM = {
    title: "",
    description: "",
    category: "",
    location: "",
    startDate: "",
    endDate: "",
    image: null,
    imagePreview: null,
};

const AddTaskPage = () => {
    const dispatch = useDispatch();
    const saving = useSelector(selectTasksSaving);
    const [form, setForm] = useState(EMPTY_FORM);

    const setField = useCallback((field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleImageSelect = useCallback((file, preview) => {
        setForm((prev) => ({ ...prev, image: file, imagePreview: preview }));
    }, []);

    const handleImageRemove = useCallback(() => {
        setForm((prev) => ({ ...prev, image: null, imagePreview: null }));
    }, []);

    const handleSubmit = useCallback(async () => {
        const error = validateTaskForm(form, "create");
        if (error) {
            toast.error(error);
            return;
        }

        const formData = new FormData();
        formData.append("title", form.title.trim());
        formData.append("description", form.description.trim());
        formData.append("category", form.category);
        formData.append("location", form.location.trim());
        formData.append("start_time", form.startDate);
        formData.append("end_time", form.endDate);
        if (form.image) formData.append("picture", form.image);

        const result = await dispatch(createTask(formData));

        if (createTask.rejected.match(result)) {
            toast.error(result.payload);
            return;
        }

        setForm(EMPTY_FORM);
        toast.success("Task added successfully ✅");
        dispatch(setActivePage("My Tasks"));
        dispatch(fetchMyTasks({ page: 1 }));
    }, [dispatch, form]);

    return (
        <div className="add-task-container">
            <div className="add-task-form">
                <h2>Add Task</h2>

                <div className="form-group">
                    <label>Task Title <span className="required">*</span></label>
                    <input
                        type="text"
                        placeholder="Task Title"
                        maxLength={120}
                        value={form.title}
                        onChange={(e) => setField("title", e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>Task Description</label>
                    <textarea
                        placeholder="Describe the task you need help with"
                        maxLength={2000}
                        value={form.description}
                        onChange={(e) => setField("description", e.target.value)}
                        rows="4"
                    />
                </div>

                <div className="form-row">
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

                    <div className="form-group">
                        <label>Location <span className="required">*</span></label>
                        <input
                            type="text"
                            placeholder="City, State"
                            maxLength={150}
                            value={form.location}
                            onChange={(e) => setField("location", e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label> Start Date <span className="required">*</span></label>
                        <input
                            type="datetime-local"
                            min={nowForInput()}
                            value={form.startDate}
                            onChange={(e) => setField("startDate", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label> End Date <span className="required">*</span></label>
                        <input
                            type="datetime-local"
                            min={form.startDate || nowForInput()}
                            value={form.endDate}
                            onChange={(e) => setField("endDate", e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Task Image</label>
                    <ImageUploadField
                        inputId="task-image"
                        preview={form.imagePreview}
                        onSelect={handleImageSelect}
                        onRemove={handleImageRemove}
                    />
                </div>

                <div className="form-actions">
                    <button className="btn-submit" onClick={handleSubmit} disabled={saving}>
                        {saving ? "Adding..." : "Add Task"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddTaskPage;
