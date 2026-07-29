import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../../services/api";
import PasswordInput from "./PasswordInput";
import { patchUser } from "../../features/auth/authSlice";
import { isValidEmail } from "../../utils/validation";
import "../../styles/settings.css";

const RESEND_COOLDOWN_SECONDS = 60;

const ChangeEmail = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);

    const [form, setForm] = useState({ password: "", new_email: "", otp: "" });

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }, []);

    useEffect(() => {
        if (timer <= 0) return undefined;
        const interval = setInterval(() => setTimer((value) => value - 1), 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const handleVerifyPassword = useCallback(async () => {
        if (!form.password) {
            toast.error("Please enter your current password");
            return;
        }

        try {
            setLoading(true);
            await api.post("/user/reverify-password", { password: form.password });
            toast.success("Password verified");
            setStep(2);
        } catch (err) {
            toast.error(getErrorMessage(err, "Verification failed"));
        } finally {
            setLoading(false);
        }
    }, [form.password]);

    const handleSendOtp = useCallback(async () => {
        if (!isValidEmail(form.new_email)) {
            toast.error("Enter a valid email address");
            return;
        }

        try {
            setLoading(true);
            await api.post("/user/change-email/send-otp", { newEmail: form.new_email.trim() });
            toast.success("OTP sent to new email");
            setStep(3);
            setTimer(RESEND_COOLDOWN_SECONDS);
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to send OTP"));
        } finally {
            setLoading(false);
        }
    }, [form.new_email]);

    const handleVerifyOtp = useCallback(async () => {
        if (!/^\d{4,6}$/.test(form.otp.trim())) {
            toast.error("Enter a valid OTP");
            return;
        }

        try {
            setLoading(true);
            const { data } = await api.post("/user/change-email/verify-otp", { otp: form.otp.trim() });

            if (data?.data?.user) dispatch(patchUser(data.data.user));
            toast.success("Email updated successfully");

            navigate("/Dashboard", { state: { openPage: "Settings" } });
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to verify OTP"));
        } finally {
            setLoading(false);
        }
    }, [dispatch, form.otp, navigate]);

    const handleResendOtp = useCallback(async () => {
        if (timer > 0) return;

        try {
            setLoading(true);
            await api.post("/user/change-email/resend-otp");
            toast.success("OTP resent");
            setTimer(RESEND_COOLDOWN_SECONDS);
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to resend OTP"));
        } finally {
            setLoading(false);
        }
    }, [timer]);

    return (
        <div className="settings-container">
            <div className="settings-card">
                <h3>Change Email</h3>

                {step === 1 && (
                    <>
                        <PasswordInput
                            name="password"
                            placeholder="Enter Current Password"
                            value={form.password}
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
                        <input
                            name="new_email"
                            placeholder="Enter New Email"
                            maxLength={100}
                            value={form.new_email}
                            onChange={handleChange}
                            onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                        />
                        <button className="settings-save-btn" onClick={handleSendOtp} disabled={loading}>
                            {loading ? "Sending OTP..." : "Send OTP"}
                        </button>
                    </>
                )}

                {step === 3 && (
                    <>
                        <input
                            name="otp"
                            placeholder="Enter OTP"
                            maxLength={6}
                            inputMode="numeric"
                            value={form.otp}
                            onChange={handleChange}
                            onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                        />
                        <button className="settings-save-btn" onClick={handleVerifyOtp} disabled={loading}>
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>
                        <button className="resend-btn" onClick={handleResendOtp} disabled={timer > 0 || loading}>
                            {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChangeEmail;
