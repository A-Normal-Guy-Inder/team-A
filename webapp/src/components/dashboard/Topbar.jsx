import React, { memo, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";

const NO_SEARCH_PAGES = ["Settings", "Add Task"];

const Topbar = ({
    activePage,
    searchTerm,
    onSearchChange,
    onOpenMenu,
    showNotifications,
    onToggleNotifications,
    onCloseNotifications,
    notifications,
    unreadCount,
    onMarkAllRead,
    onMarkRead,
    onLoadMoreNotifications,
    canLoadMoreNotifications,
}) => {
    const bellRef = useRef(null);
    const dropdownRef = useRef(null);

    /*
     * Dismiss the dropdown on any press outside it. The bell is excluded too —
     * its own onClick already toggles, so closing here as well would fire twice
     * and reopen it. Listening on `pointerdown` covers mouse, touch and pen in
     * one pass; it is registered only while the panel is open, and it lands
     * after this render commits, so the press that opened the panel is long
     * finished and cannot close it again.
     */
    useEffect(() => {
        if (!showNotifications) return;

        const handlePointerDown = (event) => {
            const target = event.target;
            if (bellRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
            onCloseNotifications();
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [showNotifications, onCloseNotifications]);

    return (
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
                <div className="notification-bell" ref={bellRef} onClick={onToggleNotifications}>
                    <Bell size={25} />
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </div>

                {showNotifications && (
                    <NotificationDropdown
                        ref={dropdownRef}
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
};

export default memo(Topbar);
