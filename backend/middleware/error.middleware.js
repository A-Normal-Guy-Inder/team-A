const multer = require("multer");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const { sendError } = require("../utils/apiResponse");
const env = require("../config/env");

const DUPLICATE_FIELD_LABELS = {
    email_id: "Email already registered",
    phone_number: "Phone number already registered",
};

function notFoundHandler(req, res, next) {
    next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

// Arity marks error handler
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    let status = 500;
    let message = "Something went wrong. Please try again later.";
    let details;

    if (err instanceof ApiError) {
        status = err.statusCode;
        message = err.message;
        details = err.details;
    } else if (err instanceof multer.MulterError) {
        status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        message = {
            LIMIT_FILE_SIZE: `File is too large. Maximum size is ${Math.round(env.upload.maxFileSizeBytes / (1024 * 1024))}MB.`,
            LIMIT_FILE_COUNT: "Only one file can be uploaded at a time.",
            LIMIT_UNEXPECTED_FILE: "Unexpected file field in the upload.",
        }[err.code] || "File upload failed.";
    } else if (err instanceof mongoose.Error.ValidationError) {
        status = 400;
        message = "Validation failed";
        details = Object.fromEntries(
            Object.entries(err.errors).map(([field, error]) => [field, error.message])
        );
    } else if (err instanceof mongoose.Error.CastError) {
        status = 400;
        message = `Invalid value for ${err.path}`;
    } else if (err && err.code === 11000) {
        status = 409;
        const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
        message = DUPLICATE_FIELD_LABELS[field] || "This record already exists";
    } else if (err && err.type === "entity.parse.failed") {
        status = 400;
        message = "Malformed JSON body";
    }

    if (status >= 500) {
        console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
    } else if (!env.isProduction) {
        console.warn(`[warn] ${req.method} ${req.originalUrl}: ${message}`);
    }

    return sendError(res, { status, message, details });
}

module.exports = { notFoundHandler, errorHandler };
