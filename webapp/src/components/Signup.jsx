import React, { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api, { getErrorMessage } from "../services/api";
import "../styles/auth.css";
import Loader from "./Loader";
import { Eye, EyeOff } from "lucide-react";
import { checkPasswordStrength, isValidEmail, isValidPhone } from "../utils/validation";
import { OTP_FLOW } from "../utils/authFlows";

const Signup = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        phone_number: "",
        email_id: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleSignup = useCallback(async () => {
        if (loading) return;

        const payload = {
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            phone_number: form.phone_number.trim(),
            email_id: form.email_id.trim().toLowerCase(),
            password: form.password.trim(),
        };

        if (Object.values(payload).some((value) => !value)) {
            toast.error("All fields are required");
            return;
        }
        if (!isValidEmail(payload.email_id)) {
            toast.error("Enter a valid email address");
            return;
        }
        if (!isValidPhone(payload.phone_number)) {
            toast.error("Enter a valid 10-digit phone number");
            return;
        }

        const strength = checkPasswordStrength(payload.password);
        if (!strength.isStrong) {
            toast.error(strength.message);
            return;
        }

        try {
            setLoading(true);
            const res = await api.post("/auth/register", payload);
            toast.success(res.data?.message || "Registration successful");
            navigate("/verify", { state: { email: payload.email_id, flow: OTP_FLOW.SIGNUP } });
        } catch (err) {
            toast.error(getErrorMessage(err, "Registration failed"));
        } finally {
            setLoading(false);
        }
    }, [form, loading, navigate]);

    return (
        <>
            {loading && <Loader />}
            <div className="auth-container">
                <div className="auth-card">
                    <h2>Create Account</h2>
                    <p>Join the Hire-a-Helper community</p>

                    <div className="two-col">
                        <div className="input-group">
                            <label htmlFor="signup-first-name" className="auth-label">
                                First Name <span className="required">*</span>
                            </label>
                            <input
                                id="signup-first-name"
                                className="auth-input"
                                name="first_name"
                                type="text"
                                maxLength={50}
                                autoComplete="given-name"
                                placeholder="First Name"
                                value={form.first_name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="signup-last-name" className="auth-label">
                                Last Name <span className="required">*</span>
                            </label>
                            <input
                                id="signup-last-name"
                                className="auth-input"
                                name="last_name"
                                type="text"
                                maxLength={50}
                                autoComplete="family-name"
                                placeholder="Last Name"
                                value={form.last_name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="signup-phone" className="auth-label">
                            Phone Number <span className="required">*</span>
                        </label>
                        <input
                            id="signup-phone"
                            className="auth-input"
                            name="phone_number"
                            maxLength={10}
                            autoComplete="tel"
                            placeholder="Phone Number"
                            value={form.phone_number}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="signup-email" className="auth-label">
                            Email Address <span className="required">*</span>
                        </label>
                        <input
                            id="signup-email"
                            className="auth-input"
                            name="email_id"
                            type="email"
                            maxLength={100}
                            autoComplete="email"
                            placeholder="Enter your email"
                            value={form.email_id}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="signup-password" className="auth-label">
                            Password <span className="required">*</span>
                        </label>
                        <div className="password-field">
                            <input
                                id="signup-password"
                                className="auth-input"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                maxLength={100}
                                autoComplete="new-password"
                                placeholder="Create your password"
                                value={form.password}
                                onChange={handleChange}
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
                    </div>

                    <button className="primary-btn" onClick={handleSignup} disabled={loading}>
                        {loading ? "Creating account..." : "Create Account"}
                    </button>

                    <div className="auth-footer">
                        Already have an account? <Link to="/login">Sign In</Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Signup;
