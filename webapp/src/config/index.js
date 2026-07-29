/**
 * Runtime configuration, resolved once from the build-time environment.
 * Nothing else in the app should read `process.env` directly.
 */

const DEFAULT_API_PORT = process.env.REACT_APP_API_PORT || "5000";

function stripTrailingSlash(value) {
    return value.endsWith("/") ? value.slice(0, -1) : value;
}

/**
 * The session lives in a `SameSite=Lax` cookie, and `localhost` and `127.0.0.1`
 * count as *different sites* to a browser. Talking to a hardcoded host that is
 * not the one the page was served from therefore makes the browser silently
 * drop the login cookie, and every following request 401s with "no token".
 *
 * Defaulting to the page's own host keeps the two in step no matter which
 * spelling the dev server was opened with.
 */
function defaultApiOrigin() {
    if (typeof window === "undefined") return `http://localhost:${DEFAULT_API_PORT}`;
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:${DEFAULT_API_PORT}`;
}

const apiUrl = stripTrailingSlash(process.env.REACT_APP_API_URL || `${defaultApiOrigin()}/api`);

// The socket server lives at the API origin without the `/api` prefix, so a
// single env var is enough for the common case.
const socketUrl = stripTrailingSlash(
    process.env.REACT_APP_SOCKET_URL || apiUrl.replace(/\/api$/, "")
);

// An explicitly configured API host that disagrees with the page host fails in
// exactly the confusing way described above, so say so out loud in development.
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    try {
        const apiHost = new URL(apiUrl).hostname;
        if (apiHost !== window.location.hostname) {
            // eslint-disable-next-line no-console
            console.warn(
                `[config] API host "${apiHost}" differs from the page host ` +
                `"${window.location.hostname}". The browser treats these as different ` +
                `sites and will discard the SameSite=Lax session cookie, so requests ` +
                `will fail with "Not authorized, no token". Open the app on ` +
                `"${apiHost}" or update REACT_APP_API_URL in webapp/.env.`
            );
        }
    } catch {
        // A malformed URL is surfaced by the request layer soon enough.
    }
}

const pageSize = Number.parseInt(process.env.REACT_APP_PAGE_SIZE, 10) || 12;

const config = {
    apiUrl,
    socketUrl,
    pageSize,
    isProduction: process.env.NODE_ENV === "production",
};

export default config;
