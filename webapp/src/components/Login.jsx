import React, { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import "../styles/auth.css";
import Loader from "../components/Loader";
import { Eye, EyeOff } from "lucide-react";
import { loginUser } from "../features/auth/authSlice";
import { isValidEmail } from "../utils/validation";
import { OTP_FLOW } from "../utils/authFlows";

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [showPassword, setShowPassword] = useState(false);
    const [email_id, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = useCallback(async () => {
        if (loading) return;

        const email = email_id.trim();
        const pass = password.trim();

        if (!email || !pass) {
            toast.error("Please enter email and password");
            return;
        }
        if (!isValidEmail(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        setLoading(true);

        const result = await dispatch(
            loginUser({ email_id: email, password: pass, rememberMe: remember })
        );

        setLoading(false);

        if (loginUser.rejected.match(result)) {
            const msg = result.payload || "Login failed";
            if (msg.toLowerCase().includes("verif")) {
                toast.error(msg);
                navigate("/verify", { state: { email, flow: OTP_FLOW.LOGIN_UNVERIFIED } });
            } else {
                toast.error(msg);
            }
            return;
        }

        toast.success("Login successful");
        navigate("/Dashboard", { replace: true });
    }, [dispatch, email_id, loading, navigate, password, remember]);

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Enter") handleLogin();
        },
        [handleLogin]
    );

    return (
        <>
            {loading && <Loader />}
            <div className="auth-container">
                <div className="auth-card">
                    <h2>Welcome Back</h2>
                    <p>Sign in to your Hire-a-Helper account</p>

                    <label htmlFor="login-email" className="auth-label">
                        Email Address <span className="required">*</span>
                    </label>
                    <input
                        id="login-email"
                        className="auth-input"
                        type="email"
                        value={email_id}
                        autoComplete="email"
                        maxLength={100}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter your email"
                    />

                    <label htmlFor="login-password" className="auth-label">
                        Password <span className="required">*</span>
                    </label>
                    <div className="password-field">
                        <input
                            id="login-password"
                            className="auth-input"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            autoComplete="current-password"
                            maxLength={100}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter your password"
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

                    <div className="auth-options">
                        <label className="remember-me">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={() => setRemember(!remember)}
                            />
                            Remember me
                        </label>

                        <Link to="/ForgotPassword" className="forgot-link">Forgot password?</Link>
                    </div>

                    <button onClick={handleLogin} disabled={loading} className="primary-btn">
                        {loading ? "Signing in..." : "Sign In"}
                    </button>

                    <div className="auth-footer">
                        Don’t have an account? <Link to="/signup">Sign Up</Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
