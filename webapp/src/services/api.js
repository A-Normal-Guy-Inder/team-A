import axios from "axios";
import config from "../config";

const api = axios.create({
    baseURL: config.apiUrl,
    withCredentials: true,
    timeout: 30000,
});

/** Endpoints where a 401 is an expected answer, not a dropped session. */
const SILENT_401_PATHS = ["/auth/me", "/auth/login", "/auth/logout"];

let onUnauthorized = null;

/**
 * Registers the callback fired when the server reports the session is gone, so
 * the store can clear itself without every component handling 401 separately.
 */
export function setUnauthorizedHandler(handler) {
    onUnauthorized = handler;
}

/** Normalised error message extraction — the API always uses `{ message }`. */
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

/**
 * Strips empty values so the query string only carries meaningful filters —
 * `?search=&status=` would otherwise reach the server as real (empty) filters.
 */
export function toQueryParams(params = {}) {
    return Object.fromEntries(
        Object.entries(params).filter(
            ([, value]) => value !== undefined && value !== null && value !== ""
        )
    );
}

export default api;
