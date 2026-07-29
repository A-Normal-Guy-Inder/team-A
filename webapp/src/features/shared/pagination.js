import config from "../../config";

/** Shape every paginated list in the store starts from. */
export const emptyList = () => ({
    items: [],
    meta: {
        page: 1,
        limit: config.pageSize,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
    },
    query: { page: 1, search: "", status: "", category: "", sortBy: "createdAt", sortOrder: "desc" },
    status: "idle",
    error: null,
});

/** Merges the meta returned by the API, keeping unknown extras (e.g. counts). */
export function applyMeta(slice, meta) {
    slice.meta = { ...slice.meta, ...(meta || {}) };
}

/**
 * Reducer helpers shared by every list. Written once so a new list cannot get
 * its loading/error bookkeeping subtly wrong.
 */
export function listPending(slice) {
    slice.status = "loading";
    slice.error = null;
}

export function listFulfilled(slice, action) {
    slice.status = "succeeded";
    slice.items = action.payload.items;
    applyMeta(slice, action.payload.meta);
}

export function listRejected(slice, action) {
    slice.status = "failed";
    slice.error = action.payload;
}

/** Normalises the API envelope into `{ items, meta }`. */
export function unwrapList(data, fallbackLimit = config.pageSize) {
    const items = Array.isArray(data?.data) ? data.data : [];
    const meta = data?.meta || {
        page: 1,
        limit: fallbackLimit,
        total: items.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
    };
    return { items, meta };
}
