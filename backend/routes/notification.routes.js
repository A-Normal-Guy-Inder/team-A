const express = require("express");
const controller = require("../controllers/notification.controller");
const validate = require("../middleware/validate.middleware");
const { notificationIdSchema } = require("../validators/user.validator");

const router = express.Router();

//   ?page&limit&status=unread|read|all&search&sortBy&sortOrder
router.get("/", controller.listNotifications);
router.get("/unread-count", controller.getUnreadCount);

// Declared before the parameterised route so `read-all` is never captured as
// a notification id.
router.put("/read-all", controller.markAllRead);
router.put("/:notificationId/read", validate(notificationIdSchema), controller.markRead);

module.exports = router;
