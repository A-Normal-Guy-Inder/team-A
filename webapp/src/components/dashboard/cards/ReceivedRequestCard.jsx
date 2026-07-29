import React, { memo } from "react";

const ReceivedRequestCard = ({ request, onAccept, onReject, pendingAction }) => {
    const requester = request.requester || {};
    const avatar = requester.profilePicture || requester.picture;
    const isBusy = Boolean(pendingAction);

    return (
        <div className="request-card">
            <div className="requester-header">
                <div className="requester-avatar">
                    {avatar ? (
                        <img
                            src={avatar}
                            alt={requester.first_name || "User"}
                            className="requester-avatar-image"
                            loading="lazy"
                        />
                    ) : (
                        (requester.first_name || "U").charAt(0).toUpperCase()
                    )}
                </div>
                <div className="requester-info">
                    <h3>{requester.name || "User"}</h3>
                </div>
            </div>

            <div className="request-task-info">
                <h4>Requesting for: {request.taskTitle || "Task"}</h4>
                {request.taskPicture && (
                    <img
                        src={request.taskPicture}
                        alt={request.taskTitle}
                        className="request-task-image"
                        loading="lazy"
                    />
                )}
            </div>

            <div className="request-message">
                <p><strong>Their message:</strong></p>
                <p className="message-text">{request.description || "No message"}</p>
            </div>

            <div className="request-meta">
                <span>📍 {request.taskLocation || "Location not specified"}</span>
                <span>🕐 {new Date(request.creationDate).toLocaleDateString()}</span>
            </div>

            <div className="request-actions">
                {request.status === "pending" ? (
                    <>
                        <button
                            className="btn-accept"
                            onClick={() => onAccept(request.requestId)}
                            disabled={isBusy}
                        >
                            {pendingAction === "accepted" ? "..." : "✓ Accept"}
                        </button>
                        <button
                            className="btn-reject"
                            onClick={() => onReject(request.requestId)}
                            disabled={isBusy}
                        >
                            {pendingAction === "rejected" ? "..." : " ✕ Reject"}
                        </button>
                    </>
                ) : (
                    <span className={`status-badge status-${request.status}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                )}
            </div>
        </div>
    );
};

export default memo(ReceivedRequestCard);
