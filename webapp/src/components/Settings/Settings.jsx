import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/settings.css";

import UpdateProfile from "./UpdateProfile";

const Settings = () => {
    const navigate = useNavigate();

    return (
        <div className="settings-container">
            <UpdateProfile />

            <div className="settings-card">
                <h3>Change Email</h3>
                <button className="settings-save-btn" onClick={() => navigate("/change-email")}>
                    Change Email
                </button>
            </div>

            <div className="settings-card">
                <h3>Change Password</h3>
                <button className="settings-save-btn" onClick={() => navigate("/change-password")}>
                    Change Password
                </button>
            </div>
        </div>
    );
};

export default Settings;
