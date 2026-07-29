const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const env = require("./config/env");
const routes = require("./routes");
const { globalLimiter } = require("./middleware/rateLimit.middleware");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");
const { sendSuccess } = require("./utils/apiResponse");

function createApp() {
    const app = express();

    // Required for correct client IPs (and therefore correct rate limiting)
    // when running behind a single reverse proxy such as Nginx or a PaaS router.
    app.set("trust proxy", 1);
    app.disable("x-powered-by");

    app.use(
        helmet({
            // The API is consumed from a different origin than it is served
            // from, so the default `same-origin` policy would block responses.
            crossOriginResourcePolicy: { policy: "cross-origin" },
            // No HTML is served from here; a CSP would only add noise.
            contentSecurityPolicy: false,
        })
    );

    app.use(
        cors({
            origin: env.frontendUrls,
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        })
    );

    app.use(express.json({ limit: "100kb" }));
    app.use(express.urlencoded({ extended: true, limit: "100kb" }));
    app.use(cookieParser());

    app.use(globalLimiter);

    app.get("/health", (req, res) =>
        sendSuccess(res, {
            message: "OK",
            data: {
                status: "ok",
                uptime: Math.round(process.uptime()),
                database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
            },
        })
    );

    app.use("/api", routes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

module.exports = createApp;
