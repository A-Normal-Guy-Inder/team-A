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

const config = {
    apiUrl,
    socketUrl,
    pageSize,
    isProduction: process.env.NODE_ENV === "production",
};

export default config;
