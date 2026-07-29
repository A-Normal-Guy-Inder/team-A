const { rules, isMissing } = require("./rules");
const { TASK_CATEGORIES } = require("../config/constants");

const startBeforeEnd = (value, payload) => {
    if (isMissing(payload.start_time) || isMissing(payload.end_time)) return undefined;
    const start = new Date(payload.start_time).getTime();
    const end = new Date(payload.end_time).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return undefined;
    return start >= end ? "Start Time must be earlier than End Time." : undefined;
};

const startNotInPast = (value) => {
    if (isMissing(value)) return undefined;
    const start = new Date(value).getTime();
    if (Number.isNaN(start)) return undefined;
    return start < Date.now() - 60_000 ? "Start Time cannot be in the past." : undefined;
};

const endNotInPast = (value) => {
    if (isMissing(value)) return undefined;
    const end = new Date(value).getTime();
    if (Number.isNaN(end)) return undefined;
    return end < Date.now() ? "End Time cannot be in the past." : undefined;
};

const createTaskSchema = {
    body: {
        title: [rules.required("Title"), rules.string("Title", { min: 3, max: 120 })],
        description: [rules.string("Description", { max: 2000 })],
        location: [rules.required("Location"), rules.string("Location", { min: 2, max: 150 })],
        category: [rules.required("Category"), rules.oneOf("Category", [...TASK_CATEGORIES])],
        start_time: [rules.required("Start Time"), rules.date("Start Time"), startNotInPast, startBeforeEnd],
        end_time: [rules.required("End Time"), rules.date("End Time")],
    },
};

const updateTaskSchema = {
    params: {
        taskId: [rules.required("Task ID"), rules.uuid("Task ID")],
    },
    body: {
        title: [rules.string("Title", { min: 3, max: 120 })],
        description: [rules.string("Description", { max: 2000 })],
        location: [rules.string("Location", { min: 2, max: 150 })],
        category: [rules.oneOf("Category", [...TASK_CATEGORIES])],
        start_time: [rules.date("Start Time"), startBeforeEnd],
        end_time: [rules.date("End Time"), endNotInPast],
    },
};

const taskIdSchema = {
    params: {
        taskId: [rules.required("Task ID"), rules.uuid("Task ID")],
    },
};

module.exports = { createTaskSchema, updateTaskSchema, taskIdSchema };
