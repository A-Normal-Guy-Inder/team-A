const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { setAuthCookie } = require("../utils/cookies");
const userService = require("../services/user.service");

const getProfile = asyncHandler(async (req, res) => {
    const user = await userService.getProfile(req.user._id);
    return sendSuccess(res, { message: "Profile fetched successfully", data: { user } });
});

const updateProfile = asyncHandler(async (req, res) => {
    const result = await userService.updateProfile(req.user._id, req.body, req.file);
    return sendSuccess(res, { message: result.message, data: { user: result.user } });
});

const uploadProfilePicture = asyncHandler(async (req, res) => {
    const result = await userService.uploadProfilePicture(req.user._id, req.file);
    return sendSuccess(res, { message: result.message, data: { user: result.user } });
});

const removeProfilePicture = asyncHandler(async (req, res) => {
    const result = await userService.removeProfilePicture(req.user._id);
    return sendSuccess(res, { message: result.message, data: { user: result.user } });
});

const reverifyPassword = asyncHandler(async (req, res) => {
    const result = await userService.reverifyPassword(req.body.password, req.user._id);
    return sendSuccess(res, { message: result.message });
});

const sendChangeEmailOtp = asyncHandler(async (req, res) => {
    const result = await userService.sendChangeEmailOtp(req.body.newEmail, req.user._id);
    return sendSuccess(res, { message: result.message });
});

const verifyChangeEmailOtp = asyncHandler(async (req, res) => {
    const result = await userService.verifyChangeEmailOtp(req.body.otp, req.user._id);
    return sendSuccess(res, { message: result.message, data: { user: result.user } });
});

const resendChangeEmailOtp = asyncHandler(async (req, res) => {
    const result = await userService.resendChangeEmailOtp(req.user._id);
    return sendSuccess(res, { message: result.message });
});

const setTwoFactor = asyncHandler(async (req, res) => {
    const result = await userService.setTwoFactor(req.user._id, req.body);
    return sendSuccess(res, { message: result.message, data: { user: result.user } });
});

const changePassword = asyncHandler(async (req, res) => {
    const result = await userService.changePassword(req.user._id, req.body);
    setAuthCookie(res, result.token, result.maxAge);
    return sendSuccess(res, { message: result.message });
});

module.exports = {
    getProfile,
    updateProfile,
    uploadProfilePicture,
    removeProfilePicture,
    reverifyPassword,
    sendChangeEmailOtp,
    verifyChangeEmailOtp,
    resendChangeEmailOtp,
    setTwoFactor,
    changePassword,
};
