const Task = require("../models/task.model");
const Requests = require("../models/request.model");
const User = require("../models/user.model");
const AcceptedTasks = require("../models/acceptedTask.model");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const { TASK_STATUS, REQUEST_STATUS, SOCKET_EVENTS } = require("../config/constants");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");
const notificationService = require("./notification.service");
const { emitToUser, emitToUsers } = require("../realtime/socket");
const { parsePagination, parseSort, buildMeta, buildSearchFilter } = require("../utils/pagination");

const SORTABLE_FIELDS = ["createdAt", "start_time", "end_time", "title", "status"];
const SEARCHABLE_FIELDS = ["title", "description", "location", "category"];

const TASK_PROJECTION = {
    title: 1,
    description: 1,
    location: 1,
    picture: 1,
    status: 1,
    start_time: 1,
    end_time: 1,
    category: 1,
    user_id: 1,
    createdAt: 1,
};

function buildTaskFilters(query = {}) {
    const filter = {};

    if (query.status && query.status !== "all") {
        const statuses = String(query.status)
            .split(",")
            .map((value) => value.trim().toLowerCase())
            .filter((value) => Object.values(TASK_STATUS).includes(value));
        if (statuses.length === 1) filter.status = statuses[0];
        else if (statuses.length > 1) filter.status = { $in: statuses };
    }

    if (query.category && query.category !== "all") {
        const categories = String(query.category)
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);
        if (categories.length === 1) filter.category = categories[0];
        else if (categories.length > 1) filter.category = { $in: categories };
    }

    if (query.location) {
        const search = buildSearchFilter(query.location, ["location"]);
        if (search) Object.assign(filter, search);
    }

    const startFrom = query.startFrom ? new Date(query.startFrom) : null;
    const startTo = query.startTo ? new Date(query.startTo) : null;
    if ((startFrom && !Number.isNaN(startFrom.getTime())) || (startTo && !Number.isNaN(startTo.getTime()))) {
        filter.start_time = {};
        if (startFrom && !Number.isNaN(startFrom.getTime())) filter.start_time.$gte = startFrom;
        if (startTo && !Number.isNaN(startTo.getTime())) filter.start_time.$lte = startTo;
    }

    const search = buildSearchFilter(query.search, SEARCHABLE_FIELDS);
    if (search) Object.assign(filter, search);

    return filter;
}

async function createTask(payload, file, userId) {
    let image = null;
    if (file) {
        image = await uploadToCloudinary(file.path, "tasks").catch((err) => {
            throw ApiError.badRequest(err.message || "Failed to upload the task image");
        });
    }

    try {
        const task = await Task.create({
            user_id: userId,
            title: payload.title,
            description: payload.description || "",
            location: payload.location,
            start_time: payload.start_time,
            end_time: payload.end_time,
            category: payload.category,
            picture: image?.secure_url || null,
            picture_public_id: image?.public_id || null,
        });

        return { task: task.toObject(), message: "Task created successfully." };
    } catch (err) {
        await deleteFromCloudinary(image?.public_id);
        throw err;
    }
}

async function updateTask(taskId, payload, file, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw ApiError.notFound("Task not found");

    if (String(task.user_id) !== String(userId)) {
        throw ApiError.forbidden("You are not allowed to edit this task");
    }

    let image = null;
    if (file) {
        image = await uploadToCloudinary(file.path, "tasks").catch((err) => {
            throw ApiError.badRequest(err.message || "Failed to upload the task image");
        });
    }

    const previousPublicId = task.picture_public_id;

    if (payload.title !== undefined) task.title = payload.title;
    if (payload.description !== undefined) task.description = payload.description;
    if (payload.location !== undefined) task.location = payload.location;
    if (payload.start_time !== undefined) task.start_time = payload.start_time;
    if (payload.end_time !== undefined) task.end_time = payload.end_time;
    if (payload.category !== undefined) task.category = payload.category;

    if (image) {
        task.picture = image.secure_url;
        task.picture_public_id = image.public_id;
    }

    if (task.status === TASK_STATUS.CLOSED && new Date(task.end_time).getTime() > Date.now()) {
        task.status = task.prev_status || TASK_STATUS.OPEN;
        task.prev_status = null;
        task.closed_at = null;
    }

    await task.save();

    if (image && previousPublicId && previousPublicId !== image.public_id) {
        await deleteFromCloudinary(previousPublicId);
    }

    return { task: task.toObject(), message: "Task updated successfully" };
}

/* Deletes task and dependents */
async function deleteTask(taskId, userId) {
    const task = await Task.findById(taskId);
    if (!task) throw ApiError.notFound("Task not found");

    if (String(task.user_id) !== String(userId)) {
        throw ApiError.forbidden("You are not allowed to delete this task");
    }

    const openRequests = await Requests.find({
        task_id: task._id,
        status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.ACCEPTED] },
    })
        .select("requester_id")
        .lean();

    const applicantIds = [...new Set(openRequests.map((request) => String(request.requester_id)))];
    const title = task.title;
    const pictureId = task.picture_public_id;

    await Requests.deleteMany({ task_id: task._id });
    await AcceptedTasks.deleteMany({ task_id: task._id });
    await task.deleteOne();

    // After row deletion
    await deleteFromCloudinary(pictureId);

    if (applicantIds.length) {
        await notificationService.notify(
            applicantIds.map((applicantId) => ({
                user_id: applicantId,
                message: `The task "${title}" you applied for has been closed by its owner.`,
                type: "task_closed",
                reference_id: String(task._id),
            }))
        );

        emitToUsers(applicantIds, SOCKET_EVENTS.REQUEST_UPDATED, { scope: "sent" });
        emitToUsers(applicantIds, SOCKET_EVENTS.TASK_UPDATED, { taskId: String(task._id) });
    }

    emitToUser(userId, SOCKET_EVENTS.REQUEST_UPDATED, { scope: "received" });

    return { message: "Task deleted successfully", notified: applicantIds.length };
}

async function listMyTasks(userId, query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const sort = parseSort(query, SORTABLE_FIELDS, "createdAt");
    const filter = { user_id: userId, ...buildTaskFilters(query) };

    const [items, total] = await Promise.all([
        Task.find(filter).select(TASK_PROJECTION).sort(sort).skip(skip).limit(limit).lean(),
        Task.countDocuments(filter),
    ]);

    return { items, meta: buildMeta({ page, limit, total }) };
}

async function listFeed(userId, query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const sort = parseSort(query, SORTABLE_FIELDS, "createdAt");

    const filter = {
        user_id: { $ne: userId },
        status: TASK_STATUS.OPEN,
        ...buildTaskFilters({ ...query, status: undefined }),
    };

    const cooldownCutoff = new Date(Date.now() - env.security.requestCooldownMs);

    const [items, total] = await Promise.all([
        Task.aggregate([
            { $match: filter },
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: User.collection.name,
                    localField: "user_id",
                    foreignField: "_id",
                    as: "author",
                    pipeline: [{ $project: { first_name: 1, last_name: 1, profile_picture: 1 } }],
                },
            },
            {
                $lookup: {
                    from: Requests.collection.name,
                    let: { taskId: "$_id" },
                    as: "my_request",
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$task_id", "$$taskId"] },
                                        { $eq: ["$requester_id", userId] },
                                    ],
                                },
                            },
                        },
                        { $project: { status: 1, rejectedAt: 1 } },
                        { $limit: 1 },
                    ],
                },
            },
            {
                $addFields: {
                    user_id: { $ifNull: [{ $arrayElemAt: ["$author", 0] }, null] },
                    requestStatus: { $ifNull: [{ $arrayElemAt: ["$my_request.status", 0] }, null] },
                    hasRequested: {
                        $let: {
                            vars: { request: { $arrayElemAt: ["$my_request", 0] } },
                            in: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: [{ $size: "$my_request" }, 0] }, then: false },
                                        {
                                            case: {
                                                $in: [
                                                    "$$request.status",
                                                    [REQUEST_STATUS.PENDING, REQUEST_STATUS.ACCEPTED],
                                                ],
                                            },
                                            then: true,
                                        },
                                        {
                                            case: { $eq: [{ $ifNull: ["$$request.rejectedAt", null] }, null] },
                                            then: true,
                                        },
                                    ],
                                    default: { $gt: ["$$request.rejectedAt", cooldownCutoff] },
                                },
                            },
                        },
                    },
                },
            },
            { $project: { ...TASK_PROJECTION, hasRequested: 1, requestStatus: 1 } },
        ]),
        Task.countDocuments(filter),
    ]);

    for (const item of items) {
        if (item.user_id === undefined) item.user_id = null;
        item.hasRequested = Boolean(item.hasRequested);
    }

    return { items, meta: buildMeta({ page, limit, total }) };
}

async function getTaskById(taskId, userId) {
    const task = await Task.findById(taskId).select(TASK_PROJECTION).lean();
    if (!task) throw ApiError.notFound("Task not found");

    const author = await User.findById(task.user_id).select(User.AUTHOR_FIELDS).lean();
    return { ...task, user_id: author || task.user_id, isOwner: String(task.user_id) === String(userId) };
}

module.exports = {
    createTask,
    updateTask,
    deleteTask,
    listMyTasks,
    listFeed,
    getTaskById,
    buildTaskFilters,
    TASK_PROJECTION,
};
