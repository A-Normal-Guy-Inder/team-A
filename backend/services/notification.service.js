const Notification = require("../models/notification.model");
const ApiError = require("../utils/ApiError");
const { parsePagination, parseSort, buildMeta, buildSearchFilter } = require("../utils/pagination");
const { emitToUser } = require("../realtime/socket");
const { SOCKET_EVENTS } = require("../config/constants");

const SORTABLE_FIELDS = ["createdAt", "read"];
const LIST_FIELDS = "_id message read type reference_id createdAt";

async function createNotifications(entries, { session = null } = {}) {
    const payload = (Array.isArray(entries) ? entries : [entries]).filter((entry) => entry?.user_id && entry?.message);
    if (!payload.length) return [];

    const created = await Notification.insertMany(payload, { session, ordered: false });
    return created;
}

function dispatchNotifications(notifications) {
    for (const notification of notifications || []) {
        emitToUser(notification.user_id, SOCKET_EVENTS.NOTIFICATION_NEW, {
            _id: notification._id,
            message: notification.message,
            read: notification.read,
            type: notification.type,
            reference_id: notification.reference_id,
            createdAt: notification.createdAt,
        });
    }
}

async function notify(entries, options = {}) {
    try {
        const created = await createNotifications(entries, options);
        if (!options.session) dispatchNotifications(created);
        return created;
    } catch (err) {
        console.error("[notification] Failed to create notification:", err.message);
        return [];
    }
}

async function listNotifications(userId, query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const sort = parseSort(query, SORTABLE_FIELDS, "createdAt");

    const filter = { user_id: userId };

    const status = String(query.status || "unread").toLowerCase();
    if (status === "unread") filter.read = false;
    else if (status === "read") filter.read = true;

    const searchFilter = buildSearchFilter(query.search, ["message"]);
    if (searchFilter) Object.assign(filter, searchFilter);

    const [items, total, unreadCount] = await Promise.all([
        Notification.find(filter).select(LIST_FIELDS).sort(sort).skip(skip).limit(limit).lean(),
        Notification.countDocuments(filter),
        Notification.countDocuments({ user_id: userId, read: false }),
    ]);

    return { items, meta: { ...buildMeta({ page, limit, total }), unreadCount } };
}

async function getUnreadCount(userId) {
    return Notification.countDocuments({ user_id: userId, read: false });
}

async function markRead(notificationId, userId) {
    const updated = await Notification.findOneAndUpdate(
        { _id: notificationId, user_id: userId },
        { $set: { read: true } },
        { new: true, projection: LIST_FIELDS }
    ).lean();

    if (!updated) throw ApiError.notFound("Notification not found");

    const unreadCount = await getUnreadCount(userId);
    emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_READ, { _id: notificationId, unreadCount });

    return { notification: updated, unreadCount };
}

async function markAllRead(userId) {
    const result = await Notification.updateMany(
        { user_id: userId, read: false },
        { $set: { read: true } }
    );

    emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_READ_ALL, { unreadCount: 0 });

    return { modifiedCount: result.modifiedCount || 0, unreadCount: 0 };
}

module.exports = {
    createNotifications,
    dispatchNotifications,
    notify,
    listNotifications,
    getUnreadCount,
    markRead,
    markAllRead,
};
