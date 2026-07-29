/**
 * Wraps an async route handler so rejected promises reach the Express error
 * handler instead of producing an unhandled rejection.
 */
const asyncHandler = (handler) => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = asyncHandler;
