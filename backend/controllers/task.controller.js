const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const taskService = require("../services/task.service");
const { TASK_CATEGORIES } = require("../config/constants");

const createTask = asyncHandler(async (req, res) => {
    const result = await taskService.createTask(req.body, req.file, req.user._id);
    return sendSuccess(res, {
        status: 201,
        message: result.message,
        data: { task: result.task, taskId: result.task._id },
    });
});

const updateTask = asyncHandler(async (req, res) => {
    const result = await taskService.updateTask(req.params.taskId, req.body, req.file, req.user._id);
    return sendSuccess(res, {
        message: result.message,
        data: { task: result.task, taskId: result.task._id },
    });
});

const deleteTask = asyncHandler(async (req, res) => {
    const result = await taskService.deleteTask(req.params.taskId, req.user._id);
    return sendSuccess(res, { message: result.message, data: { notified: result.notified } });
});

const listMyTasks = asyncHandler(async (req, res) => {
    const { items, meta } = await taskService.listMyTasks(req.user._id, req.query);
    return sendSuccess(res, { message: "User tasks fetched successfully", data: items, meta });
});

const listFeed = asyncHandler(async (req, res) => {
    const { items, meta } = await taskService.listFeed(req.user._id, req.query);
    return sendSuccess(res, { message: "Other users tasks fetched successfully", data: items, meta });
});

const getTask = asyncHandler(async (req, res) => {
    const task = await taskService.getTaskById(req.params.taskId, req.user._id);
    return sendSuccess(res, { message: "Task fetched successfully", data: task });
});

const listCategories = asyncHandler(async (req, res) => {
    return sendSuccess(res, { message: "Categories fetched successfully", data: TASK_CATEGORIES });
});

module.exports = { createTask, updateTask, deleteTask, listMyTasks, listFeed, getTask, listCategories };
