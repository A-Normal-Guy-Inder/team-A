const express = require("express");
const controller = require("../controllers/auth.controller");
const validate = require("../middleware/validate.middleware");
const protect = require("../middleware/auth.middleware");
const noStore = require("../middleware/noStore.middleware");
const { authLimiter, otpLimiter } = require("../middleware/rateLimit.middleware");
const schemas = require("../validators/auth.validator");

const router = express.Router();

/* No auth response cacheable */
router.use(noStore);

router.post("/register", otpLimiter, validate(schemas.registerSchema), controller.register);
router.post("/verify-otp", authLimiter, validate(schemas.verifyOtpSchema), controller.verifyOtp);
router.post("/resend-otp", otpLimiter, validate(schemas.emailOnlySchema), controller.resendOtp);
router.post("/login", authLimiter, validate(schemas.loginSchema), controller.login);
router.post("/verify-2fa", authLimiter, validate(schemas.verifyTwoFactorSchema), controller.verifyTwoFactor);
router.post("/forgot-password", otpLimiter, validate(schemas.emailOnlySchema), controller.forgotPassword);
router.post("/reset-password", authLimiter, validate(schemas.resetPasswordSchema), controller.resetPassword);
router.post("/logout", controller.logout);
router.get("/me", protect, controller.me);

module.exports = router;
