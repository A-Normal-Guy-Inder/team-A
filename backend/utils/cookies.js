const env = require("../config/env");

function baseOptions() {
    return {
        httpOnly: true,
        secure: env.cookieSecure,
        sameSite: env.cookieSameSite,
        path: "/",
    };
}

function setAuthCookie(res, token, maxAge) {
    res.cookie(env.cookieName, token, { ...baseOptions(), maxAge });
}

function clearAuthCookie(res) {
    // Clearing only works when the attributes match those used when setting.
    res.clearCookie(env.cookieName, baseOptions());
}

module.exports = { setAuthCookie, clearAuthCookie };
