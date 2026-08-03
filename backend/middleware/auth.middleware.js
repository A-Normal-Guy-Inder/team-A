const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { setNoStore } = require("./noStore.middleware");
const env = require("../config/env");

const protect = asyncHandler(async (req, res, next) => {
    // Applied before any check below, so the 401s are uncacheable too.
    // Everything behind this middleware is somebody's private data.
    setNoStore(res);

    const token = req.cookies?.[env.cookieName];
    if (!token) {
        throw ApiError.unauthorized("Not authorized, no token");
    }

    let decoded;
    try {
        decoded = jwt.verify(token, env.jwtSecret);
    } catch (err) {
        throw ApiError.unauthorized(
            err.name === "TokenExpiredError" ? "Session expired, please login again" : "Invalid token"
        );
    }

    const user = await User.findById(decoded.userId)
        .select(
            "_id first_name last_name email_id phone_number profile_picture bio is_verified " +
                "two_factor_enabled last_password_change sessions_valid_from"
        )
        .lean();

    if (!user) {
        throw ApiError.unauthorized("User no longer exists");
    }

    const passwordChangedAtSeconds = Math.floor(new Date(user.last_password_change).getTime() / 1000);
    if (decoded.iat < passwordChangedAtSeconds) {
        throw ApiError.unauthorized("Session is no longer valid, please login again");
    }

    /*
     * Clearing the cookie only removes the browser's copy — the token itself
     * stays valid until it expires, so anything that captured it could keep
     * using it after the user believed they had logged out. Logout stamps
     * sessions_valid_from, and every token minted earlier dies here.
     *
     * `iat` has one-second resolution, so a token issued in the same second as
     * the logout would survive a strict comparison; rounding the cutoff up
     * closes that window.
     */
    if (user.sessions_valid_from) {
        const invalidBeforeSeconds = Math.ceil(new Date(user.sessions_valid_from).getTime() / 1000);
        if (decoded.iat < invalidBeforeSeconds) {
            throw ApiError.unauthorized("Session is no longer valid, please login again");
        }
    }

    req.user = user;
    req.authToken = token;
    return next();
});

module.exports = protect;
