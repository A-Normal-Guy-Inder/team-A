const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { SOCKET_EVENTS } = require("../config/constants");

let io = null;

/**
 * Minimal cookie header parser. Written inline rather than pulling in a
 * transitive dependency of Express, which is not a contract we control.
 */
function parseCookies(header = "") {
    const jar = {};
    for (const part of header.split(";")) {
        const index = part.indexOf("=");
        if (index < 0) continue;
        const key = part.slice(0, index).trim();
        if (!key) continue;
        try {
            jar[key] = decodeURIComponent(part.slice(index + 1).trim());
        } catch {
            jar[key] = part.slice(index + 1).trim();
        }
    }
    return jar;
}

/** Every socket for a user shares one room, so a user with several tabs stays in sync. */
const userRoom = (userId) => `user:${userId}`;

/**
 * Attaches a Socket.IO server to the given HTTP server.
 *
 * Authentication reuses the same HTTP-only JWT cookie as the REST API: the
 * token is never exposed to JavaScript on the client, so it cannot be passed in
 * a handshake `auth` payload — reading it from the handshake headers keeps the
 * existing security model intact.
 */
function initSocket(httpServer) {
    io = new Server(httpServer, {
        path: "/socket.io",
        cors: {
            origin: env.frontendUrls,
            credentials: true,
            methods: ["GET", "POST"],
        },
        serveClient: false,
        pingInterval: 25000,
        pingTimeout: 20000,
    });

    io.use((socket, next) => {
        try {
            const cookies = parseCookies(socket.handshake.headers?.cookie || "");
            const token = cookies[env.cookieName];
            if (!token) return next(new Error("UNAUTHORIZED"));

            const decoded = jwt.verify(token, env.jwtSecret);
            socket.data.userId = decoded.userId;
            return next();
        } catch {
            return next(new Error("UNAUTHORIZED"));
        }
    });

    io.on("connection", (socket) => {
        const { userId } = socket.data;
        socket.join(userRoom(userId));

        socket.on("disconnect", (reason) => {
            if (!env.isProduction) {
                console.log(`[socket] ${userId} disconnected (${reason})`);
            }
        });
    });

    console.log("[socket] Socket.IO ready");
    return io;
}

/**
 * Emits to a single user's room. Safe to call before/without a socket server
 * (tests, scripts) — delivery is best-effort by design, since the REST API
 * remains the source of truth.
 */
function emitToUser(userId, event, payload) {
    if (!io || !userId) return;
    try {
        io.to(userRoom(userId)).emit(event, payload);
    } catch (err) {
        console.error("[socket] Emit failed:", err.message);
    }
}

function emitToUsers(userIds, event, payload) {
    if (!io || !userIds?.length) return;
    const rooms = [...new Set(userIds.filter(Boolean).map(String))].map(userRoom);
    if (!rooms.length) return;
    try {
        io.to(rooms).emit(event, payload);
    } catch (err) {
        console.error("[socket] Broadcast failed:", err.message);
    }
}

function getIO() {
    return io;
}

async function closeSocket() {
    if (!io) return;
    await io.close();
    io = null;
}

module.exports = { initSocket, emitToUser, emitToUsers, getIO, closeSocket, SOCKET_EVENTS };
