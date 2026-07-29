const env = require("../config/env");

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSearchFilter(search, fields) {
    const term = typeof search === "string" ? search.trim() : "";
    if (!term || !fields.length) return null;
    const regex = new RegExp(escapeRegex(term), "i");
    return fields.length === 1 ? { [fields[0]]: regex } : { $or: fields.map((f) => ({ [f]: regex })) };
}

function parsePagination(query = {}) {
    const rawPage = Number.parseInt(query.page, 10);
    const rawLimit = Number.parseInt(query.limit, 10);

    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, env.pagination.maxLimit)
        : env.pagination.defaultLimit;

    return { page, limit, skip: (page - 1) * limit };
}

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
