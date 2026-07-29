import React, { memo } from "react";
import { PAGES } from "../../features/ui/uiSlice";

const Sidebar = ({ activePage, onNavigate, user, pendingCount, onLogoutClick }) => (
    <aside className="sidebar">
        <div className="sidebar-header">
            <h3 className="logo">Hire-a-Helper</h3>
        </div>

        <ul className="sidebar-menu">
            {PAGES.map((page) => (
                <li
                    key={page}
                    className={activePage === page ? "active" : ""}
                    onClick={() => onNavigate(page)}
                >
                    {page}
                    {page === "Requests" && pendingCount > 0 && (
                        <span className="pending-badge">{pendingCount}</span>
                    )}
                </li>
            ))}
        </ul>

        <div className="sidebar-footer">
            <div className="sidebar-footer-info">
                <div className="sidebar-footer-user">
                    {user?.picture ? (
                        <img src={user.picture} alt="profile" className="sidebar-footer-avatar" />
                    ) : (
                        (user?.first_name || user?.email || "U").charAt(0).toUpperCase()
                    )}
                </div>
                <div className="sidebar-footer-text">
                    <strong>
                        {`${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "User"}
                    </strong>
                    <span>{user?.email || "user@email.com"}</span>
                </div>
            </div>
            <button className="logout-btn" onClick={onLogoutClick}>Logout</button>
        </div>
    </aside>
);

export default memo(Sidebar);
