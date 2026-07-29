const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { SOCKET_EVENTS } = require("../config/constants");

let io = null;

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

const userRoom = (userId) => `user:${userId}`;

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

    // Token from handshake cookie
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
