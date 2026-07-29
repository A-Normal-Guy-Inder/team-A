import React, { memo } from "react";

const formatDate = (value) => new Date(value).toLocaleDateString();
const formatTime = (value) => new Date(value).toLocaleTimeString();

function resolveRequestButton({ isOwnTask, hasRequested, isUnavailable }) {
    if (isOwnTask) return { text: "Your Task", disabled: true, className: "request-btn disabled" };
    if (hasRequested) return { text: "Requested", disabled: true, className: "request-btn requested" };
    if (isUnavailable) return { text: "Unavailable", disabled: true, className: "request-btn unavailable" };
    return { text: "Request Task", disabled: false, className: "request-btn" };
}

const TaskCard = ({ task, currentUserId, onRequestTask, editable = false, onEdit }) => {
    if (!task) return null;

    const author = typeof task.user_id === "object" && task.user_id !== null ? task.user_id : null;
    const authorId = author?._id ?? task.user_id;

    const isOwnTask = Boolean(currentUserId) && String(currentUserId) === String(authorId);
    const isUnavailable = ["completed", "cancelled", "assigned", "closed"].includes(task.status);
    const userProfilePicture = author?.profile_picture || author?.picture;
    const userInitial = (author?.first_name || "U").charAt(0).toUpperCase();

    const button = resolveRequestButton({
        isOwnTask,
        hasRequested: Boolean(task.hasRequested),
        isUnavailable,
    });

    return (
        <div className="task-card">
            <div className="task-image-wrapper">
                {task.picture ? (
                    <img src={task.picture} alt="task" className="task-image" loading="lazy" />
                ) : (
                    <div className="task-image-placeholder"><span>📷 No image provided</span></div>
                )}
            </div>

            <div className="badges-container">
                <div className="tag">{task.category || "General"}</div>
                {editable && task.status && (
                    <div className={`status-badge status-${task.status.toLowerCase()}`}>{task.status}</div>
                )}
            </div>

            <div className="card-content">
                <h3>{task.title}</h3>
                <p className="task-description">{task.description?.trim() || "No description provided"}</p>

                {task.location && (
                    <p className="task-location"><span className="icon">📍</span> {task.location}</p>
                )}

                {task.start_time && (
                    <p className="task-date">
                        <span className="icon">🟢</span> Start: {formatDate(task.start_time)} • {formatTime(task.start_time)}
                    </p>
                )}

                {task.end_time && (
                    <p className="task-date end-date">
                        <span className="icon">🔴</span> End: {formatDate(task.end_time)} • {formatTime(task.end_time)}
                    </p>
                )}

                <div className="task-footer">
                    <div className="task-author">
                        <div className="author-avatar">
                            {userProfilePicture ? (
                                <img
                                    src={userProfilePicture}
                                    alt={author?.first_name || "User"}
                                    className="author-avatar-image"
                                    loading="lazy"
                                />
                            ) : (
                                userInitial
                            )}
                        </div>
                        <div className="author-name">
                            <span>{author?.first_name || "User"}</span>
                            {author?.last_name && <span> {author.last_name}</span>}
                        </div>
                    </div>

                    {editable && (
                        <button className="edit-btn" onClick={() => onEdit(task)}>✏️ Edit Task</button>
                    )}

                    {!editable && onRequestTask && (
                        <button
                            className={button.className}
                            onClick={() => !button.disabled && onRequestTask(task)}
                            disabled={button.disabled}
                        >
                            {button.text}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(TaskCard);
