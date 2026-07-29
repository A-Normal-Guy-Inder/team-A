const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { setAuthCookie, clearAuthCookie } = require("../utils/cookies");
const authService = require("../services/auth.service");

const register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    return sendSuccess(res, { status: 201, message: result.message });
});

const verifyOtp = asyncHandler(async (req, res) => {
    const result = await authService.verifyEmailOtp(req.body);
    return sendSuccess(res, { message: result.message });
});

const resendOtp = asyncHandler(async (req, res) => {
    const result = await authService.resendOtp(req.body);
    return sendSuccess(res, { message: result.message });
});

const login = asyncHandler(async (req, res) => {
    const rememberMe = Boolean(req.body.rememberMe ?? req.body.remember);
    const result = await authService.login({ ...req.body, rememberMe });

    setAuthCookie(res, result.token, result.maxAge);

    return sendSuccess(res, { message: "Login successful", data: { user: result.user } });
});

const forgotPassword = asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body);
    return sendSuccess(res, { message: result.message });
});

const resetPassword = asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.body);
    clearAuthCookie(res);
    return sendSuccess(res, { message: result.message });
});

const logout = asyncHandler(async (req, res) => {
    clearAuthCookie(res);
    return sendSuccess(res, { message: "Logged out successfully" });
});

const me = asyncHandler(async (req, res) => {
    return sendSuccess(res, {
        message: "Authenticated",
        data: {
            authenticated: true,
            user: {
                _id: req.user._id,
                first_name: req.user.first_name,
                last_name: req.user.last_name,
                email_id: req.user.email_id,
                phone_number: req.user.phone_number,
                profile_picture: req.user.profile_picture,
                is_verified: req.user.is_verified,
            },
        },
    });
});

module.exports = { register, verifyOtp, resendOtp, login, forgotPassword, resetPassword, logout, me };
