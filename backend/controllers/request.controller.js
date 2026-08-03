const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const requestService = require("../services/request.service");

const createRequest = asyncHandler(async (req, res) => {
    const result = await requestService.createRequest(req.body, req.params.taskId, req.user);
    return sendSuccess(res, {
        status: 201,
        message: result.message,
        data: { requestId: result.requestId },
    });
});

const listReceived = asyncHandler(async (req, res) => {
    const { items, meta } = await requestService.listReceivedRequests(req.user._id, req.query);
    return sendSuccess(res, { message: "Received requests fetched successfully", data: items, meta });
});

const listSent = asyncHandler(async (req, res) => {
    const { items, meta } = await requestService.listSentRequests(req.user._id, req.query);
    return sendSuccess(res, { message: "Sent requests fetched successfully", data: items, meta });
});

const withdrawRequest = asyncHandler(async (req, res) => {
    const result = await requestService.withdrawRequest(req.params.requestId, req.user);
    return sendSuccess(res, { message: result.message });
});

const updateStatus = asyncHandler(async (req, res) => {
    const result = await requestService.updateRequestStatus(
        req.params.requestId,
        req.body.status,
        req.user._id
    );
    return sendSuccess(res, { message: result.message });
});

module.exports = { createRequest, listReceived, listSent, withdrawRequest, updateStatus };
