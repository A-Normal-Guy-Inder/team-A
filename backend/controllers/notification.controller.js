const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const notificationService = require("../services/notification.service");

const listNotifications = asyncHandler(async (req, res) => {
    const { items, meta } = await notificationService.listNotifications(req.user._id, req.query);
    return sendSuccess(res, { message: "Notifications fetched successfully", data: items, meta });
});

const getUnreadCount = asyncHandler(async (req, res) => {
    const unreadCount = await notificationService.getUnreadCount(req.user._id);
    return sendSuccess(res, { message: "Unread count fetched", data: { unreadCount } });
});

const markRead = asyncHandler(async (req, res) => {
    const result = await notificationService.markRead(req.params.notificationId, req.user._id);
    return sendSuccess(res, { message: "Notification marked as read", data: result });
});

const markAllRead = asyncHandler(async (req, res) => {
    const result = await notificationService.markAllRead(req.user._id);
    return sendSuccess(res, { message: "All notifications marked as read", data: result });
});

module.exports = { listNotifications, getUnreadCount, markRead, markAllRead };
