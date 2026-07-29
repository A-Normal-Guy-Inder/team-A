const mongoose = require("mongoose");
const env = require("./env");

mongoose.set("strictQuery", true);
mongoose.set("bufferCommands", false);

async function connectDB() {
    mongoose.connection.on("connected", () => console.log("[db] MongoDB connected"));
    mongoose.connection.on("disconnected", () => console.warn("[db] MongoDB disconnected"));
    mongoose.connection.on("error", (err) => console.error("[db] MongoDB error:", err.message));

    await mongoose.connect(env.mongoUri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 20,
        minPoolSize: 2,
        autoIndex: false,
    });

    return mongoose.connection;
}

async function disconnectDB() {
    await mongoose.connection.close(false);
}

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
