const { rules } = require("./rules");
const { REQUEST_STATUS } = require("../config/constants");

const createRequestSchema = {
    params: {
        taskId: [rules.required("Task ID"), rules.uuid("Task ID")],
    },
    body: {
        description: [rules.required("Message"), rules.string("Message", { min: 1, max: 1000 })],
    },
};

const updateRequestSchema = {
    params: {
        requestId: [rules.required("Request ID"), rules.objectId("Request ID")],
    },
    body: {
        status: [
            rules.required("Status"),
            rules.oneOf("Status", [REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.REJECTED]),
        ],
    },
};

const requestIdSchema = {
    params: {
        requestId: [rules.required("Request ID"), rules.objectId("Request ID")],
    },
};

module.exports = { createRequestSchema, updateRequestSchema, requestIdSchema };
