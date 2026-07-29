import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
    fetchSentRequests,
    selectRequestSending,
    sendRequest,
} from "../../../features/requests/requestsSlice";
import { markTaskRequested } from "../../../features/tasks/tasksSlice";

const SendRequestModal = ({ task, onClose }) => {
    const dispatch = useDispatch();
    const sending = useSelector(selectRequestSending);
    const [message, setMessage] = useState("");

    const handleSubmit = useCallback(async () => {
        const description = message.trim();
        if (!description) return;

        const result = await dispatch(sendRequest({ taskId: task._id, description }));

        if (sendRequest.rejected.match(result)) {
            toast.error(result.payload);
            if (String(result.payload).toLowerCase().includes("already")) onClose();
            return;
        }

        dispatch(markTaskRequested(task._id));
        dispatch(fetchSentRequests({ page: 1 }));
        toast.success("Task request sent successfully 📩");
        onClose();
    }, [dispatch, message, onClose, task._id]);

    return (
        <div className="modal-overlay">
            <div className="modal request-modal">
                <h2>Send Request</h2>

                <div className="modal-task-info">
                    <h3>{task.title}</h3>
                    {task.picture && (
                        <img src={task.picture} alt={task.title} className="modal-task-image" />
                    )}
                </div>

                <label>Your Message to the Task Owner</label>
                <textarea
                    placeholder="Tell the task owner about your experience, availability, and why you'd be great for this task..."
                    value={message}
                    maxLength={1000}
                    onChange={(e) => setMessage(e.target.value)}
                    rows="6"
                    style={{ width: "100%", padding: "10px", marginBottom: "15px" }}
                />

                <div className="modal-actions">
                    <button
                        className="btn-submit"
                        onClick={handleSubmit}
                        disabled={sending || !message.trim()}
                    >
                        {sending ? "Sending..." : "Send Request"}
                    </button>
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default SendRequestModal;
