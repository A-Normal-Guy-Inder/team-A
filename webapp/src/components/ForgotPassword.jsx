import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/auth.css";
import api, { getErrorMessage } from "../services/api";
import Loader from "./Loader";
import { isValidEmail } from "../utils/validation";
import { OTP_FLOW } from "../utils/authFlows";

const ForgotPassword = () => {
    const navigate = useNavigate();

    const [email_id, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSendOtp = useCallback(async () => {
        if (loading) return;

        const cleanEmail = email_id.trim();
        if (!isValidEmail(cleanEmail)) {
            toast.error("Enter a valid email address");
            return;
        }

        try {
            setLoading(true);
            const res = await api.post("/auth/forgot-password", { email_id: cleanEmail });
            toast.success(res.data?.message || "If email exists, OTP has been sent.");
            navigate("/verify", { state: { email: cleanEmail, flow: OTP_FLOW.PASSWORD_RESET } });
        } catch (err) {
            toast.error(getErrorMessage(err, "Could not send the OTP. Please try again."));
        } finally {
            setLoading(false);
        }
    }, [email_id, loading, navigate]);

    return (
        <>
            {loading && <Loader />}
            <div className="auth-container">
                <div className="auth-card">
                    <h2>Forgot Password</h2>
                    <p>Enter your registered email to receive OTP</p>

                    <label>Email Address <span className="required">*</span></label>
                    <input
                        type="email"
                        placeholder="Enter email"
                        value={email_id}
                        maxLength={100}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    />

                    <button onClick={handleSendOtp} disabled={loading}>
                        {loading ? "Sending..." : "Send OTP"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ForgotPassword;
