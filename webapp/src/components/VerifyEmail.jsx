import React, { useCallback, useEffect, useState } from "react";
import "../styles/auth.css";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api, { getErrorMessage } from "../services/api";
import Loader from "./Loader";
import { OTP_FLOW } from "../utils/authFlows";

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyEmail = () => {
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email;
    const flow = location.state?.flow;

    useEffect(() => {
        if (!email) navigate(flow === OTP_FLOW.SIGNUP ? "/signup" : "/login", { replace: true });
    }, [email, flow, navigate]);

    useEffect(() => {
        if (cooldown <= 0) return undefined;
        const timer = setInterval(() => setCooldown((value) => value - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleVerify = useCallback(async () => {
        if (loading) return;

        const cleanOtp = otp.trim();
        if (!/^\d{4,6}$/.test(cleanOtp)) {
            toast.error("Enter a valid OTP");
            return;
        }

        try {
            setLoading(true);
            const res = await api.post("/auth/verify-otp", { email_id: email, otp: cleanOtp });

            toast.success(res.data?.message || "OTP verified");

            // Only the forgot-password journey earns a password-reset grant from the
            // backend, so it is the only one allowed on to /ResetPassword. Every other
            // flow (including an unverified login) has just verified its account and
            // belongs back at the login screen.
            if (flow === OTP_FLOW.PASSWORD_RESET) {
                navigate("/ResetPassword", { replace: true, state: { email } });
            } else {
                navigate("/login", { replace: true });
            }
        } catch (err) {
            toast.error(getErrorMessage(err, "Invalid OTP"));
        } finally {
            setLoading(false);
        }
    }, [email, flow, loading, navigate, otp]);

    const handleResend = useCallback(async () => {
        if (loading || cooldown > 0) return;

        try {
            setLoading(true);
            const res = await api.post("/auth/resend-otp", { email_id: email });
            toast.success(res.data?.message || "OTP resent");
            setCooldown(RESEND_COOLDOWN_SECONDS);
        } catch (err) {
            const msg = getErrorMessage(err, "Something went wrong");
            if (msg.toLowerCase().includes("already verified")) {
                toast.success("Email already verified. Please login.");
                navigate("/login", { replace: true });
            } else {
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    }, [cooldown, email, loading, navigate]);

    if (!email) return null;

    return (
        <>
            {loading && <Loader />}
            <div className="auth-container">
                <div className="auth-card">
                    <h2>Verify Your OTP</h2>
                    <p>OTP sent to: {email}</p>

                    <label htmlFor="verify-otp" className="auth-label">
                        Verification Code <span className="required">*</span>
                    </label>
                    <input
                        id="verify-otp"
                        className="auth-input text-center text-lg font-semibold tracking-[0.5em]
                                   placeholder:tracking-normal placeholder:text-base
                                   placeholder:font-normal"
                        placeholder="Enter OTP"
                        value={otp}
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    />

                    <button className="primary-btn" onClick={handleVerify} disabled={loading}>
                        {loading ? "Verifying..." : "Verify Code"}
                    </button>

                    <button
                        className="secondary-btn"
                        onClick={handleResend}
                        disabled={loading || cooldown > 0}
                    >
                        {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default VerifyEmail;
