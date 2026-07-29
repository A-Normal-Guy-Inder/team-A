import React, { memo } from "react";

const NotificationDropdown = ({ notifications, hasUnread, onMarkAllRead, onMarkRead, onLoadMore, canLoadMore }) => (
    <div className="notification-dropdown">
        <div className="notification-header">
            <span>Notifications</span>
            {hasUnread && (
                <p className="mark-all-btn" onClick={onMarkAllRead}>Mark all as read</p>
            )}
        </div>

        <div className="notification-list">
            {notifications.length === 0 ? (
                <div className="notification-empty"><p>No notifications yet</p></div>
            ) : (
                <>
                    {notifications.map((note) => (
                        <div
                            key={note._id}
                            className={`notification-item ${note.read ? "read" : "unread"}`}
                            onClick={() => !note.read && onMarkRead(note._id)}
                        >
                            <div className="notification-dot" />
                            <div className="notification-content">
                                <p className="notification-message">{note.message}</p>
                                <p className="notification-time">
                                    {new Date(note.createdAt).toLocaleDateString()} •{" "}
                                    {new Date(note.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {canLoadMore && (
                        <div className="notification-item notification-load-more" onClick={onLoadMore}>
                            <div className="notification-content">
                                <p className="notification-message">Load older notifications</p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
);

export default memo(NotificationDropdown);
