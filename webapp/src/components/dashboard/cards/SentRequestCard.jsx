import React, { memo } from "react";

const STATUS_LABELS = {
    pending: "🟡 Pending",
    accepted: "🟢 Accepted",
    rejected: "🔴 Rejected",
};

const SentRequestCard = ({ request }) => (
    <div className="request-card my-request-card">
        <div className="request-task-image-wrapper">
            {request.taskPicture ? (
                <img
                    src={request.taskPicture}
                    alt={request.taskTitle || "Task"}
                    className="request-task-image"
                    loading="lazy"
                />
            ) : (
                <div className="request-task-image-placeholder">📷 No image provided</div>
            )}
        </div>

        <div className="request-card-body">
            <h3 className="request-title">{request.taskTitle || "Untitled task"}</h3>
            <p className="request-owner">
                <strong>Owner:</strong> {request.taskOwnerName || "Not available"}
            </p>
            {request.taskLocation && <p className="task-location">📍 {request.taskLocation}</p>}
            <div className="request-message">
                <strong>Your message:</strong>
                <p>{request.description || "No message"}</p>
            </div>
        </div>

        <div className="request-status-section">
            <span className={`status-badge status-${request.status}`}>
                {STATUS_LABELS[request.status] || request.status}
            </span>
            <p className="request-date">
                {request.creationDate
                    ? `Sent ${new Date(request.creationDate).toLocaleDateString()}`
                    : "Date not available"}
            </p>
        </div>
    </div>
);

export default memo(SentRequestCard);
