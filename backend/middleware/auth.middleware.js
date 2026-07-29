const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const env = require("../config/env");

const protect = asyncHandler(async (req, res, next) => {
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
        .select("_id first_name last_name email_id phone_number profile_picture is_verified last_password_change")
        .lean();

    if (!user) {
        throw ApiError.unauthorized("User no longer exists");
    }

    const passwordChangedAtSeconds = Math.floor(new Date(user.last_password_change).getTime() / 1000);
    if (decoded.iat < passwordChangedAtSeconds) {
        throw ApiError.unauthorized("Session is no longer valid, please login again");
    }

    req.user = user;
    req.authToken = token;
    return next();
});

module.exports = protect;
