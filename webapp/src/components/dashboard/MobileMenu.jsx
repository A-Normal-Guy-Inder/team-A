import React, { memo } from "react";
import { PAGES } from "../../features/ui/uiSlice";

const MobileMenu = ({ onClose, onNavigate, onLogoutClick }) => (
    <div className="hamburger-overlay" onClick={onClose}>
        <div className="hamburger-menu" onClick={(e) => e.stopPropagation()}>
            <h3>Hire-a-Helper</h3>
            <ul className="menu-list">
                {PAGES.map((page) => (
                    <li key={page} onClick={() => onNavigate(page)} style={{ cursor: "pointer" }}>
                        {page}
                    </li>
                ))}
            </ul>
            <div className="sidebar-footer">
                <button className="logout-btn" onClick={onLogoutClick}>Logout</button>
            </div>
        </div>
    </div>
);

export default memo(MobileMenu);
