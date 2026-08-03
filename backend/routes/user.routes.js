const express = require("express");
const controller = require("../controllers/user.controller");
const validate = require("../middleware/validate.middleware");
const { single } = require("../middleware/upload.middleware");
const { writeLimiter, otpLimiter, authLimiter } = require("../middleware/rateLimit.middleware");
const schemas = require("../validators/user.validator");

const router = express.Router();

router.get("/profile", controller.getProfile);
router.put(
    "/profile",
    writeLimiter,
    ...single("profile_picture"),
    validate(schemas.updateProfileSchema),
    controller.updateProfile
);

/* Picture set/cleared independently */
router.post(
    "/profile-picture",
    writeLimiter,
    ...single("profile_picture"),
    controller.uploadProfilePicture
);
router.delete("/profile-picture", writeLimiter, controller.removeProfilePicture);

router.post("/reverify-password", authLimiter, validate(schemas.passwordOnlySchema), controller.reverifyPassword);

router.post("/change-email/send-otp", otpLimiter, validate(schemas.changeEmailSchema), controller.sendChangeEmailOtp);
router.post("/change-email/verify-otp", authLimiter, validate(schemas.otpOnlySchema), controller.verifyChangeEmailOtp);
router.post("/change-email/resend-otp", otpLimiter, controller.resendChangeEmailOtp);

router.put("/two-factor", authLimiter, validate(schemas.twoFactorSchema), controller.setTwoFactor);

router.put("/change-password", authLimiter, validate(schemas.changePasswordSchema), controller.changePassword);

module.exports = router;
