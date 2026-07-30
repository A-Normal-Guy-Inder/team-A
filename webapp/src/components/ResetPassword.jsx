import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/auth.css";
import api, { getErrorMessage } from "../services/api";
import Loader from "./Loader";
import { Eye, EyeOff } from "lucide-react";
import { checkPasswordStrength } from "../utils/validation";

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email;

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!email) {
            toast.error("Session expired. Please try again.");
            navigate("/ForgotPassword", { replace: true });
        }
    }, [email, navigate]);

    const handleReset = useCallback(async () => {
        if (loading) return;

        const cleanPassword = password.trim();
        const cleanConfirm = confirmPassword.trim();

        if (!cleanPassword || !cleanConfirm) {
            toast.error("All fields are required");
            return;
        }
        if (cleanPassword !== cleanConfirm) {
            toast.error("Passwords do not match");
            return;
        }

        const strength = checkPasswordStrength(cleanPassword);
        if (!strength.isStrong) {
            toast.error(strength.message);
            return;
        }

        try {
            setLoading(true);
            const res = await api.post("/auth/reset-password", {
                email_id: email,
                password: cleanPassword,
            });
            toast.success(res.data?.message || "Password reset successful.");
            navigate("/login", { replace: true });
        } catch (err) {
            toast.error(getErrorMessage(err, "Reset failed"));
        } finally {
            setLoading(false);
        }
    }, [confirmPassword, email, loading, navigate, password]);

    if (!email) return null;

    return (
        <>
            {loading && <Loader />}
            <div className="auth-container">
                <div className="auth-card">
                    <h2>Reset Password</h2>
                    <p>Create a new password</p>

                    <label htmlFor="reset-password" className="auth-label">
                        New Password <span className="required">*</span>
                    </label>
                    <div className="password-field">
                        <input
                            id="reset-password"
                            className="auth-input"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="New password"
                            value={password}
                            maxLength={100}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <label htmlFor="reset-confirm-password" className="auth-label">
                        Confirm Password <span className="required">*</span>
                    </label>
                    <div className="password-field">
                        <input
                            id="reset-confirm-password"
                            className="auth-input"
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            maxLength={100}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleReset()}
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            aria-label={
                                showConfirmPassword ? "Hide password" : "Show password"
                            }
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button className="primary-btn" onClick={handleReset} disabled={loading}>
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ResetPassword;
