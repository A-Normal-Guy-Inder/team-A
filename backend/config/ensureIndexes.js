const models = require("../models");
const env = require("./env");

/**
 * Builds every index declared on the schemas, once, after the connection is up.
 *
 * Mongoose's `autoIndex` cannot be relied on here: the models are compiled when
 * `app.js` is imported, which happens *before* `connectDB()` runs, so the
 * implicit `Model.init()` fires against a connection that is not ready yet and
 * quietly does nothing. Doing it explicitly also means failures are visible.
 *
 * `createIndexes` only adds what is missing — unlike `syncIndexes`, it never
 * drops an index that is not in the schema, which would be destructive on a
 * database shared with anything else.
 */
async function ensureIndexes() {
    if (!env.jobs.ensureIndexes) {
        console.log("[db] Index sync skipped (ENSURE_INDEXES=false)");
        return;
    }

    const results = await Promise.allSettled(
        Object.entries(models).map(async ([name, model]) => {
            await model.createIndexes();
            return name;
        })
    );

    const failures = results.filter((result) => result.status === "rejected");

    for (const failure of failures) {
        const reason = failure.reason;
        // A unique index cannot be built over data that already violates it.
        // That is worth shouting about, but it must not stop the server: the
        // constraint is also enforced in the service layer.
        if (reason?.code === 11000 || reason?.codeName === "DuplicateKey") {
            console.error(
                "[db] Could not build a unique index — existing documents violate it. " +
                `Resolve the duplicates and restart. Details: ${reason.message}`
            );
        } else {
            console.error("[db] Index creation failed:", reason?.message || reason);
        }
    }

    console.log(`[db] Indexes ensured for ${results.length - failures.length}/${results.length} models`);
}

module.exports = ensureIndexes;
