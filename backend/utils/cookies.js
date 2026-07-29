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
    res.clearCookie(env.cookieName, baseOptions());
}

module.exports = { setAuthCookie, clearAuthCookie };
