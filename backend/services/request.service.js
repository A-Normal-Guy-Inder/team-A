const mongoose = require("mongoose");
const Requests = require("../models/request.model");
const Task = require("../models/task.model");
const User = require("../models/user.model");
const AcceptedTasks = require("../models/acceptedTask.model");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const { supportsTransactions } = require("../config/db");
const { TASK_STATUS, REQUEST_STATUS, SOCKET_EVENTS } = require("../config/constants");
const { parsePagination, parseSort, buildMeta, buildSearchFilter } = require("../utils/pagination");
const notificationService = require("./notification.service");
const { emitToUser, emitToUsers } = require("../realtime/socket");

const SORTABLE_FIELDS = ["createdAt", "status", "updatedAt"];

async function createRequest({ description }, taskId, requester) {
    const task = await Task.findById(taskId).select("user_id title status").lean();
    if (!task) throw ApiError.notFound("Task not found");

    if (String(task.user_id) === String(requester._id)) {
        throw ApiError.forbidden("You cannot send a request for your own task");
    }

    if (task.status !== TASK_STATUS.OPEN) {
        throw ApiError.badRequest("Task is not available for requests");
    }

    const existing = await Requests.findOne({ task_id: taskId, requester_id: requester._id });

    if (existing) {
        if (existing.status !== REQUEST_STATUS.REJECTED) {
            throw ApiError.conflict("You have already sent a request for this task");
        }

        const rejectedAt = existing.rejectedAt ? new Date(existing.rejectedAt).getTime() : null;
        const retryAt = rejectedAt ? rejectedAt + env.security.requestCooldownMs : Infinity;

        if (Date.now() < retryAt) {
            const hoursLeft = Math.ceil((retryAt - Date.now()) / (60 * 60 * 1000));
            throw ApiError.conflict(
                `Your previous request was rejected. You can request again in ${hoursLeft} hour(s).`
            );
        }

        existing.status = REQUEST_STATUS.PENDING;
        existing.description = description || "";
        existing.rejectedAt = null;
        existing.resolvedAt = null;
        await existing.save();

        await notifyNewRequest(task, requester, existing);
        return { requestId: existing._id, message: "Request sent successfully" };
    }

    let request;
    try {
        request = await Requests.create({
            task_id: taskId,
            requester_id: requester._id,
            description: description || "",
            status: REQUEST_STATUS.PENDING,
        });
    } catch (err) {
        if (err?.code === 11000) {
            throw ApiError.conflict("You have already sent a request for this task");
        }
        throw err;
    }

    await notifyNewRequest(task, requester, request);
    return { requestId: request._id, message: "Request sent successfully" };
}

async function notifyNewRequest(task, requester, request) {
    const requesterName = `${requester.first_name} ${requester.last_name}`.trim();
    await notificationService.notify({
        user_id: task.user_id,
        message: `New request received for your task "${task.title}" from ${requesterName}.`,
        type: "request_received",
        reference_id: String(request._id),
    });
    emitToUser(task.user_id, SOCKET_EVENTS.REQUEST_UPDATED, { scope: "received" });
}

function mapReceivedRequest(request, requesterMap, taskMap) {
    const requester = requesterMap.get(String(request.requester_id));
    const task = taskMap.get(String(request.task_id));
    const firstName = requester?.first_name || "Unknown";
    const lastName = requester?.last_name || "";

    return {
        requestId: request._id,
        taskId: task?._id || request.task_id,
        taskTitle: task?.title || "Untitled Task",
        taskLocation: task?.location || "Unknown Location",
        taskPicture: task?.picture || null,
        taskStatus: task?.status || null,
        creationDate: request.createdAt,
        requester: {
            name: [firstName, lastName].filter(Boolean).join(" "),
            first_name: firstName,
            last_name: lastName,
            profilePicture: requester?.profile_picture || null,
        },
        status: request.status,
        description: request.description,
    };
}

async function listReceivedRequests(userId, query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const sort = parseSort(query, SORTABLE_FIELDS, "createdAt");

    const taskSearch = buildSearchFilter(query.search, ["title", "location", "category"]);

    const allOwnedIds = (await Task.find({ user_id: userId }).select("_id").lean()).map((t) => t._id);
    if (!allOwnedIds.length) {
        return { items: [], meta: { ...buildMeta({ page, limit, total: 0 }), pendingCount: 0 } };
    }

    const pendingCountPromise = Requests.countDocuments({
        task_id: { $in: allOwnedIds },
        status: REQUEST_STATUS.PENDING,
    });

    const matchedTaskIds = taskSearch
        ? (await Task.find({ user_id: userId, ...taskSearch }).select("_id").lean()).map((t) => t._id)
        : allOwnedIds;

    if (!matchedTaskIds.length) {
        return {
            items: [],
            meta: { ...buildMeta({ page, limit, total: 0 }), pendingCount: await pendingCountPromise },
        };
    }

    const requestFilter = { task_id: { $in: matchedTaskIds } };
    if (query.status && query.status !== "all") {
        const statuses = String(query.status)
            .split(",")
            .map((value) => value.trim().toLowerCase())
            .filter((value) => Object.values(REQUEST_STATUS).includes(value));
        if (statuses.length) requestFilter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    } else {
        /* Withdrawn drops from inbox */
        requestFilter.status = { $ne: REQUEST_STATUS.WITHDRAWN };
    }

    const [requests, total, pendingCount] = await Promise.all([
        Requests.find(requestFilter)
            .select("task_id requester_id status description createdAt")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        Requests.countDocuments(requestFilter),
        pendingCountPromise,
    ]);

    if (!requests.length) {
        return { items: [], meta: { ...buildMeta({ page, limit, total }), pendingCount } };
    }

    const [requesters, tasks] = await Promise.all([
        User.find({ _id: { $in: requests.map((r) => r.requester_id) } })
            .select(User.AUTHOR_FIELDS)
            .lean(),
        Task.find({ _id: { $in: requests.map((r) => r.task_id) } })
            .select("title location picture status")
            .lean(),
    ]);

    const requesterMap = new Map(requesters.map((user) => [String(user._id), user]));
    const taskMap = new Map(tasks.map((task) => [String(task._id), task]));

    return {
        items: requests.map((request) => mapReceivedRequest(request, requesterMap, taskMap)),
        meta: { ...buildMeta({ page, limit, total }), pendingCount },
    };
}

function buildStatusMatch(status) {
    if (!status || status === "all") return null;

    const statuses = String(status)
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter((value) => Object.values(REQUEST_STATUS).includes(value));

    if (!statuses.length) return null;

    return { status: statuses.length === 1 ? statuses[0] : { $in: statuses } };
}

async function listSentRequests(userId, query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const sort = parseSort(query, SORTABLE_FIELDS, "createdAt");

    const search = typeof query.search === "string" ? query.search.trim() : "";
    const statusMatch = buildStatusMatch(query.status);

    const taskLookup = {
        $lookup: {
            from: Task.collection.name,
            localField: "task_id",
            foreignField: "_id",
            as: "task",
            pipeline: [{ $project: { title: 1, location: 1, picture: 1, status: 1, user_id: 1 } }],
        },
    };
    const unwindTask = { $unwind: { path: "$task", preserveNullAndEmptyArrays: true } };

    /* Search-narrowed, deliberately not status-filtered */
    const basePipeline = [{ $match: { requester_id: userId } }];
    if (search) {
        basePipeline.push(taskLookup, unwindTask, {
            $match: buildSearchFilter(search, ["task.title", "task.location"]),
        });
    }

    const pipeline = [...basePipeline];
    if (statusMatch) pipeline.push({ $match: statusMatch });

    // Paginate first, then join
    pipeline.push({ $sort: sort }, { $skip: skip }, { $limit: limit });
    if (!search) pipeline.push(taskLookup, unwindTask);

    pipeline.push(
        {
            $lookup: {
                from: User.collection.name,
                localField: "task.user_id",
                foreignField: "_id",
                as: "owner",
                pipeline: [{ $project: { first_name: 1, last_name: 1, profile_picture: 1 } }],
            },
        },
        {
            $project: {
                _id: 0,
                requestId: "$_id",
                status: 1,
                description: 1,
                creationDate: "$createdAt",
                taskId: "$task._id",
                taskTitle: { $ifNull: ["$task.title", "Task Unavailable"] },
                taskLocation: { $ifNull: ["$task.location", "Unknown Location"] },
                taskPicture: { $ifNull: ["$task.picture", null] },
                taskStatus: { $ifNull: ["$task.status", null] },
                owner: { $ifNull: [{ $arrayElemAt: ["$owner", 0] }, null] },
            },
        }
    );

    const countPipeline = [...basePipeline];
    if (statusMatch) countPipeline.push({ $match: statusMatch });
    countPipeline.push({ $count: "total" });

    const countsPipeline = [...basePipeline, { $group: { _id: "$status", count: { $sum: 1 } } }];

    const [items, total, countRows] = await Promise.all([
        Requests.aggregate(pipeline),
        Requests.aggregate(countPipeline).then((rows) => rows[0]?.total || 0),
        Requests.aggregate(countsPipeline),
    ]);

    const statusCounts = Object.values(REQUEST_STATUS).reduce(
        (counts, status) => ({ ...counts, [status]: 0 }),
        {}
    );
    for (const row of countRows) {
        if (row._id in statusCounts) statusCounts[row._id] = row.count;
    }
    // Summed before adding `all`
    statusCounts.all = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

    const mapped = items.map((item) => {
        const ownerName = item.owner
            ? [item.owner.first_name, item.owner.last_name].filter(Boolean).join(" ")
            : "";
        return {
            requestId: item.requestId,
            taskId: item.taskId || null,
            taskTitle: item.taskTitle,
            taskLocation: item.taskLocation,
            taskPicture: item.taskPicture,
            taskStatus: item.taskStatus,
            taskOwnerName: ownerName || "Not available",
            taskOwnerPicture: item.owner?.profile_picture || null,
            status: item.status,
            creationDate: item.creationDate,
            description: item.description,
        };
    });

    return { items: mapped, meta: { ...buildMeta({ page, limit, total }), statusCounts } };
}

/* Retracts application; row kept */
async function withdrawRequest(requestId, requester) {
    const request = await Requests.findById(requestId);
    if (!request) throw ApiError.notFound("Request not found");

    if (String(request.requester_id) !== String(requester._id)) {
        throw ApiError.forbidden("You are not allowed to withdraw this request");
    }

    if (request.status === REQUEST_STATUS.WITHDRAWN) {
        throw ApiError.conflict("This request has already been withdrawn");
    }

    if (request.status !== REQUEST_STATUS.PENDING) {
        throw ApiError.badRequest(`A request that was already ${request.status} cannot be withdrawn`);
    }

    const task = await Task.findById(request.task_id).select("user_id title").lean();

    const now = new Date();
    request.status = REQUEST_STATUS.WITHDRAWN;
    request.withdrawnAt = now;
    request.resolvedAt = now;
    await request.save();

    if (task) {
        const requesterName = `${requester.first_name} ${requester.last_name}`.trim();

        await notificationService.notify({
            user_id: task.user_id,
            message: `${requesterName} withdrew their application for your task "${task.title}".`,
            type: "request_withdrawn",
            reference_id: String(request._id),
        });

        // Refreshes owner list, badge
        emitToUser(task.user_id, SOCKET_EVENTS.REQUEST_UPDATED, { scope: "received" });
    }

    emitToUser(requester._id, SOCKET_EVENTS.REQUEST_UPDATED, { scope: "sent" });

    return { message: "Request withdrawn successfully" };
}

async function updateRequestStatus(requestId, action, ownerId) {
    const useTransaction = supportsTransactions();
    const session = useTransaction ? await mongoose.startSession() : null;

    let outcome;
    try {
        if (session) session.startTransaction();

        outcome = await applyStatusChange(requestId, action, ownerId, session);

        if (session) await session.commitTransaction();
    } catch (err) {
        if (session?.inTransaction()) await session.abortTransaction();
        throw err;
    } finally {
        if (session) await session.endSession();
    }

    // Emit only after commit
    await notificationService.notify(outcome.notifications);
    emitToUsers(outcome.affectedUserIds, SOCKET_EVENTS.REQUEST_UPDATED, { scope: "sent" });
    emitToUser(ownerId, SOCKET_EVENTS.REQUEST_UPDATED, { scope: "received" });
    if (outcome.taskId) {
        emitToUsers(outcome.affectedUserIds, SOCKET_EVENTS.TASK_UPDATED, { taskId: outcome.taskId });
    }

    return { message: outcome.message };
}

async function applyStatusChange(requestId, action, ownerId, session) {
    const query = Requests.findOne({ _id: requestId, status: REQUEST_STATUS.PENDING });
    if (session) query.session(session);
    const request = await query;

    if (!request) throw ApiError.badRequest("Request already processed or not found");

    const taskQuery = Task.findById(request.task_id).select("user_id title status");
    if (session) taskQuery.session(session);
    const task = await taskQuery;

    if (!task) throw ApiError.notFound("Task not found");
    if (String(task.user_id) !== String(ownerId)) throw ApiError.forbidden("Not authorized");

    const now = new Date();

    if (action === REQUEST_STATUS.REJECTED) {
        request.status = REQUEST_STATUS.REJECTED;
        request.rejectedAt = now;
        request.resolvedAt = now;
        await request.save({ session });

        return {
            message: "Request rejected successfully",
            taskId: String(task._id),
            affectedUserIds: [request.requester_id],
            notifications: [
                {
                    user_id: request.requester_id,
                    message: `Your request for "${task.title}" was rejected.`,
                    type: "request_rejected",
                    reference_id: String(request._id),
                },
            ],
        };
    }

    if (task.status !== TASK_STATUS.OPEN) {
        throw ApiError.badRequest("This task is no longer open for assignment");
    }

    request.status = REQUEST_STATUS.ACCEPTED;
    request.resolvedAt = now;
    request.rejectedAt = null;
    await request.save({ session });

    await AcceptedTasks.findOneAndUpdate(
        { task_id: task._id },
        {
            $set: {
                task_id: task._id,
                user_id: request.requester_id,
                request_id: request._id,
                status: REQUEST_STATUS.ACCEPTED,
            },
        },
        { upsert: true, new: true, session }
    );

    const siblingQuery = Requests.find({
        task_id: task._id,
        _id: { $ne: request._id },
        status: REQUEST_STATUS.PENDING,
    }).select("requester_id");
    if (session) siblingQuery.session(session);
    const siblings = await siblingQuery;

    if (siblings.length) {
        await Requests.updateMany(
            { task_id: task._id, _id: { $ne: request._id }, status: REQUEST_STATUS.PENDING },
            { $set: { status: REQUEST_STATUS.REJECTED, rejectedAt: now, resolvedAt: now } },
            { session }
        );
    }

    task.status = TASK_STATUS.ASSIGNED;
    await task.save({ session });

    const notifications = [
        {
            user_id: request.requester_id,
            message: `Your request for "${task.title}" was accepted!`,
            type: "request_accepted",
            reference_id: String(request._id),
        },
        ...siblings.map((sibling) => ({
            user_id: sibling.requester_id,
            message: `Your request for "${task.title}" was rejected because the task was assigned to someone else.`,
            type: "request_rejected",
            reference_id: String(task._id),
        })),
    ];

    return {
        message: "Request accepted successfully",
        taskId: String(task._id),
        affectedUserIds: [request.requester_id, ...siblings.map((s) => s.requester_id)],
        notifications,
    };
}

module.exports = {
    createRequest,
    listReceivedRequests,
    listSentRequests,
    withdrawRequest,
    updateRequestStatus,
};
