import React, { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../../services/api";
import PasswordInput from "./PasswordInput";
import { checkPasswordStrength } from "../../utils/validation";
import "../../styles/settings.css";

const ChangePasswordPage = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleVerifyPassword = useCallback(async () => {
        if (!form.current_password) {
            toast.error("Please enter your current password");
            return;
        }

        try {
            setLoading(true);
            await api.post("/user/reverify-password", { password: form.current_password });
            toast.success("Password verified");
            setStep(2);
        } catch (err) {
            toast.error(getErrorMessage(err, "Verification failed"));
        } finally {
            setLoading(false);
        }
    }, [form.current_password]);

    const handleChangePassword = useCallback(async () => {
        if (form.new_password !== form.confirm_password) {
            toast.error("Passwords do not match");
            return;
        }
        if (form.new_password === form.current_password) {
            toast.error("New password must be different from current password.");
            return;
        }

        const strength = checkPasswordStrength(form.new_password);
        if (!strength.isStrong) {
            toast.error(strength.message);
            return;
        }

        try {
            setLoading(true);
            await api.put("/user/change-password", {
                current_password: form.current_password,
                new_password: form.new_password,
            });

            toast.success("Password changed successfully");
            // The old redirect went to `/dashboard?tab=settings`, which matched
            // no route and dropped the user on the login page.
            navigate("/Dashboard", { state: { openPage: "Settings" } });
        } catch (err) {
            toast.error(getErrorMessage(err, "Password change failed"));
        } finally {
            setLoading(false);
        }
    }, [form, navigate]);

    return (
        <div className="settings-container">
            <div className="settings-card">
                <h3>Change Password</h3>

                {step === 1 && (
                    <>
                        <PasswordInput
                            name="current_password"
                            placeholder="Enter Current Password"
                            value={form.current_password}
                            onChange={handleChange}
                            onEnter={handleVerifyPassword}
                            autoComplete="current-password"
                        />
                        <button className="settings-save-btn" onClick={handleVerifyPassword} disabled={loading}>
                            {loading ? "Verifying..." : "Verify Password"}
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <PasswordInput
                            name="new_password"
                            placeholder="New Password"
                            value={form.new_password}
                            onChange={handleChange}
                            autoComplete="new-password"
                        />
                        <PasswordInput
                            name="confirm_password"
                            placeholder="Confirm Password"
                            value={form.confirm_password}
                            onChange={handleChange}
                            onEnter={handleChangePassword}
                            autoComplete="new-password"
                        />
                        <button className="settings-save-btn" onClick={handleChangePassword} disabled={loading}>
                            {loading ? "Updating..." : "Change Password"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChangePasswordPage;
