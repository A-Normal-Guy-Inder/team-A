function sendSuccess(res, { status = 200, message = "OK", data = null, meta = undefined } = {}) {
    const body = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(status).json(body);
}

function sendError(res, { status = 500, message = "Something went wrong", details = undefined } = {}) {
    const body = { success: false, message, data: null };
    if (details) body.details = details;
    return res.status(status).json(body);
}

module.exports = { sendSuccess, sendError };
