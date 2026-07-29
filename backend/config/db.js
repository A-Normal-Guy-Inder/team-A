const mongoose = require("mongoose");
const env = require("./env");

mongoose.set("strictQuery", true);
// Fail fast instead of buffering queries forever when the driver is not connected.
mongoose.set("bufferCommands", false);

async function connectDB() {
    mongoose.connection.on("connected", () => console.log("[db] MongoDB connected"));
    mongoose.connection.on("disconnected", () => console.warn("[db] MongoDB disconnected"));
    mongoose.connection.on("error", (err) => console.error("[db] MongoDB error:", err.message));

    await mongoose.connect(env.mongoUri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 20,
        minPoolSize: 2,
        // Index creation is driven explicitly by `ensureIndexes()` after the
        // connection is up. The implicit path cannot work here because the
        // models are compiled before `connectDB()` is ever called.
        autoIndex: false,
    });

    return mongoose.connection;
}

async function disconnectDB() {
    await mongoose.connection.close(false);
}

/**
 * Multi-document transactions require a replica set. Standalone deployments
 * throw at `startSession`, so callers can degrade gracefully.
 */
function supportsTransactions() {
    const topology = mongoose.connection?.client?.topology;
    if (!topology) return false;
    const description = topology.description;
    if (!description) return false;
    return description.type === "ReplicaSetWithPrimary" || description.type === "Sharded";
}

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.disconnectDB = disconnectDB;
module.exports.supportsTransactions = supportsTransactions;
