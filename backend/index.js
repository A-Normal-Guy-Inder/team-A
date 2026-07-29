// Must load before models
const env = require("./config/env");

const http = require("http");
const createApp = require("./app");
const connectDB = require("./config/db");
const { disconnectDB } = require("./config/db");
const ensureIndexes = require("./config/ensureIndexes");
const { initSocket, closeSocket } = require("./realtime/socket");
const { startScheduler, stopScheduler } = require("./jobs/scheduler");

let server;

async function bootstrap() {
    env.assertConfig();

    await connectDB();
    await ensureIndexes();

    const app = createApp();
    server = http.createServer(app);

    initSocket(server);
    startScheduler();

    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(env.port, () => {
            server.off("error", reject);
            resolve();
        });
    });

    console.log(`[server] Listening on port ${env.port} (${env.nodeEnv})`);
}

async function shutdown(signal) {
    console.log(`[server] ${signal} received, shutting down...`);

    const forceExit = setTimeout(() => {
        console.error("[server] Forced shutdown after timeout");
        process.exit(1);
    }, 10000);
    forceExit.unref();

    try {
        await stopScheduler();
        await closeSocket();
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        await disconnectDB();
        console.log("[server] Shutdown complete");
        process.exit(0);
    } catch (err) {
        console.error("[server] Shutdown failed:", err);
        process.exit(1);
    }
}

["SIGINT", "SIGTERM"].forEach((signal) => process.on(signal, () => shutdown(signal)));

process.on("unhandledRejection", (reason) => {
    console.error("[server] Unhandled rejection:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("[server] Uncaught exception:", err);
    shutdown("uncaughtException");
});

bootstrap().catch((err) => {
    console.error("[server] Failed to start:", err.message);
    process.exit(1);
});

module.exports = { bootstrap, shutdown };
