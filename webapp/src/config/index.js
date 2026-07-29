const DEFAULT_API_PORT = process.env.REACT_APP_API_PORT || "5000";

function stripTrailingSlash(value) {
    return value.endsWith("/") ? value.slice(0, -1) : value;
}

// Cookie host must match
function defaultApiOrigin() {
    if (typeof window === "undefined") return `http://localhost:${DEFAULT_API_PORT}`;
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:${DEFAULT_API_PORT}`;
}

const apiUrl = stripTrailingSlash(process.env.REACT_APP_API_URL || `${defaultApiOrigin()}/api`);

const socketUrl = stripTrailingSlash(
    process.env.REACT_APP_SOCKET_URL || apiUrl.replace(/\/api$/, "")
);

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
        // Malformed URL fails later
    }
}

const pageSize = Number.parseInt(process.env.REACT_APP_PAGE_SIZE, 10) || 12;

// Free-tier hosts (Render, Fly) suspend an idle service and cold-start it on the
// next request, which regularly takes 50s+ — longer than a typical 30s timeout.
// The first request after an idle period would otherwise always abort before the
// server finished waking. Lower this once the backend is on an always-on plan.
const apiTimeout = Number.parseInt(process.env.REACT_APP_API_TIMEOUT, 10) || 90000;

const config = {
    apiUrl,
    socketUrl,
    pageSize,
    apiTimeout,
    isProduction: process.env.NODE_ENV === "production",
};

export default config;
