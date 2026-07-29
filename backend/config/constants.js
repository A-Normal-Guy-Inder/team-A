const TASK_STATUS = Object.freeze({
    OPEN: "open",
    ASSIGNED: "assigned",
    CLOSED: "closed",
});

const REQUEST_STATUS = Object.freeze({
    PENDING: "pending",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
});

const ACCEPTED_TASK_STATUS = Object.freeze({
    PENDING: "pending",
    ACCEPTED: "accepted",
    COMPLETED: "completed",
});

const TASK_STATUSES = Object.values(TASK_STATUS);
const REQUEST_STATUSES = Object.values(REQUEST_STATUS);
const ACCEPTED_TASK_STATUSES = Object.values(ACCEPTED_TASK_STATUS);

const ASSIGNABLE_TASK_STATUSES = [TASK_STATUS.OPEN, TASK_STATUS.ASSIGNED];

const TASK_CATEGORIES = Object.freeze([
    "Cleaning",
    "Repair",
    "Delivery",
    "Tech",
    "Car Service",
    "Household Help",
    "Electrical Work",
    "Plumbing",
    "Gardening",
    "Moving & Shifting",
    "Computer Help",
    "Painting",
    "Vehicle Help",
    "Event Assistance",
    "Shopping Assistance",
    "Elderly Care",
    "Other",
]);

const SOCKET_EVENTS = Object.freeze({
    NOTIFICATION_NEW: "notification:new",
    NOTIFICATION_READ: "notification:read",
    NOTIFICATION_READ_ALL: "notification:read-all",
    TASK_UPDATED: "task:updated",
    REQUEST_UPDATED: "request:updated",
});

module.exports = {
    TASK_STATUS,
    TASK_STATUSES,
    ASSIGNABLE_TASK_STATUSES,
    REQUEST_STATUS,
    REQUEST_STATUSES,
    ACCEPTED_TASK_STATUS,
    ACCEPTED_TASK_STATUSES,
    TASK_CATEGORIES,
    SOCKET_EVENTS,
};
