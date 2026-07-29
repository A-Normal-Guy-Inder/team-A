/**
 * Operational (expected) error carrying an HTTP status code.
 * Anything thrown that is not an ApiError is treated as a programmer error and
 * reported as a generic 500 by the central error handler.
 */
class ApiError extends Error {
    constructor(statusCode, message, details = undefined) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        this.isOperational = true;
        if (details) this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = "Bad request", details) {
        return new ApiError(400, message, details);
    }

    static unauthorized(message = "Not authorized") {
        return new ApiError(401, message);
    }

    static forbidden(message = "Forbidden") {
        return new ApiError(403, message);
    }

    static notFound(message = "Resource not found") {
        return new ApiError(404, message);
    }

    static conflict(message = "Conflict") {
        return new ApiError(409, message);
    }

    static payloadTooLarge(message = "Payload too large") {
        return new ApiError(413, message);
    }

    static tooManyRequests(message = "Too many requests") {
        return new ApiError(429, message);
    }

    static internal(message = "Something went wrong") {
        return new ApiError(500, message);
    }
}

module.exports = ApiError;
