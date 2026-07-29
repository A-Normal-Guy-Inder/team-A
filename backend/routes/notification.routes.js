const express = require("express");
const controller = require("../controllers/notification.controller");
const validate = require("../middleware/validate.middleware");
const { notificationIdSchema } = require("../validators/user.validator");

const router = express.Router();

router.get("/", controller.listNotifications);
router.get("/unread-count", controller.getUnreadCount);

router.put("/read-all", controller.markAllRead);
router.put("/:notificationId/read", validate(notificationIdSchema), controller.markRead);

module.exports = router;
