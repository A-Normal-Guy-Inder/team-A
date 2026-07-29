const env = require("../config/env");

/**
 * Escapes a user supplied string so it can be embedded in a RegExp literally.
 * Without this a search term such as `a(b` throws, and `.*` would let a caller
 * force a full collection scan.
 */
function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds a case-insensitive "contains" matcher across the given fields.
 * Returns `null` when there is nothing to search for.
 */
function buildSearchFilter(search, fields) {
    const term = typeof search === "string" ? search.trim() : "";
    if (!term || !fields.length) return null;
    const regex = new RegExp(escapeRegex(term), "i");
    return fields.length === 1 ? { [fields[0]]: regex } : { $or: fields.map((f) => ({ [f]: regex })) };
}

/**
 * Normalises `?page` / `?limit` into safe numbers plus a mongo `skip`.
 */
function parsePagination(query = {}) {
    const rawPage = Number.parseInt(query.page, 10);
    const rawLimit = Number.parseInt(query.limit, 10);

    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, env.pagination.maxLimit)
        : env.pagination.defaultLimit;

    return { page, limit, skip: (page - 1) * limit };
}

/**
 * Turns `?sortBy=title&sortOrder=asc` into a mongo sort object, restricted to
 * an allow-list so callers cannot sort on unindexed/private fields.
 * `_id` is appended as a tie-breaker to keep pagination stable.
 */
function parseSort(query = {}, allowedFields, fallback = "createdAt") {
    const requested = typeof query.sortBy === "string" ? query.sortBy.trim() : "";
    const field = allowedFields.includes(requested) ? requested : fallback;
    const direction = String(query.sortOrder).toLowerCase() === "asc" ? 1 : -1;
    return { [field]: direction, _id: direction };
}

function buildMeta({ page, limit, total }) {
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
}

module.exports = { escapeRegex, buildSearchFilter, parsePagination, parseSort, buildMeta };
