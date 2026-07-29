import React, { memo } from "react";
import { Bell } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";

/** Tabs where the search box is meaningless. */
const NO_SEARCH_PAGES = ["Settings", "Add Task"];

const Topbar = ({
    activePage,
    searchTerm,
    onSearchChange,
    onOpenMenu,
    showNotifications,
    onToggleNotifications,
    notifications,
    unreadCount,
    onMarkAllRead,
    onMarkRead,
    onLoadMoreNotifications,
    canLoadMoreNotifications,
}) => (
    <div className="topbar">
        <div className="topbar-left">
            <span className="hamburger-icon" onClick={onOpenMenu}>☰</span>
            <h2>{activePage}</h2>
        </div>

        <div className="topbar-center">
            {!NO_SEARCH_PAGES.includes(activePage) && (
                <input
                    type="text"
                    placeholder={`Search in ${activePage.toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            )}
        </div>

        <div className="topbar-right">
            <div className="notification-bell" onClick={onToggleNotifications}>
                <Bell size={25} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </div>

            {showNotifications && (
                <NotificationDropdown
                    notifications={notifications}
                    hasUnread={unreadCount > 0}
                    onMarkAllRead={onMarkAllRead}
                    onMarkRead={onMarkRead}
                    onLoadMore={onLoadMoreNotifications}
                    canLoadMore={canLoadMoreNotifications}
                />
            )}
        </div>
    </div>
);

export default memo(Topbar);
