import axios from "axios";
import config from "../config";

const api = axios.create({
    baseURL: config.apiUrl,
    withCredentials: true,
    timeout: config.apiTimeout,
});

// Fired once at startup so an idle free-tier backend begins waking while the user
// is still reading the page, instead of on their first login attempt. Failure is
// expected and ignored — this is a warm-up, not a health gate.
export function warmBackend() {
    const healthUrl = config.apiUrl.replace(/\/api$/, "") + "/health";
    return fetch(healthUrl, { credentials: "include", cache: "no-store" }).catch(() => { });
}

const SILENT_401_PATHS = ["/auth/me", "/auth/login", "/auth/logout"];

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
    onUnauthorized = handler;
}

export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.code === "ECONNABORTED") return "The request timed out. Please try again.";
    if (error?.message === "Network Error") return "Cannot reach the server. Please check your connection.";
    return error?.message || fallback;
}

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || "";

        if (status === 401 && !SILENT_401_PATHS.some((path) => url.includes(path))) {
            onUnauthorized?.();
        }

        return Promise.reject(error);
    }
);

export function toQueryParams(params = {}) {
    return Object.fromEntries(
        Object.entries(params).filter(
            ([, value]) => value !== undefined && value !== null && value !== ""
        )
    );
}

export default api;
