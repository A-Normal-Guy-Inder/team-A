const models = require("../models");
const env = require("./env");

async function ensureIndexes() {
    if (!env.jobs.ensureIndexes) {
        console.log("[db] Index sync skipped (ENSURE_INDEXES=false)");
        return;
    }

    const results = await Promise.allSettled(
        Object.entries(models).map(async ([name, model]) => {
            // createIndexes never drops indexes
            await model.createIndexes();
            return name;
        })
    );

    const failures = results.filter((result) => result.status === "rejected");

    for (const failure of failures) {
        const reason = failure.reason;
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
