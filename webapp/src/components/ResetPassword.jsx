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

                    <label>New Password <span className="required">*</span></label>
                    <div className="password-field">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="New password"
                            value={password}
                            maxLength={100}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <span
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ cursor: "pointer" }}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>

                    <label>Confirm Password <span className="required">*</span></label>
                    <div className="password-field">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            value={confirmPassword}
                            maxLength={100}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleReset()}
                        />
                        <span
                            className="toggle-password"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{ cursor: "pointer" }}
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>

                    <button onClick={handleReset} disabled={loading}>
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ResetPassword;
