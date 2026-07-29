const express = require("express");
const protect = require("../middleware/auth.middleware");

const router = express.Router();

router.use("/auth", require("./auth.routes"));

// Everything below requires a session; `protect` is mounted once here rather
// than being repeated in each router.
router.use("/task", protect, require("./task.routes"));
router.use("/requests", protect, require("./request.routes"));
router.use("/notifications", protect, require("./notification.routes"));
router.use("/user", protect, require("./user.routes"));

module.exports = router;
