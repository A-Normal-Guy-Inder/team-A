import { io } from "socket.io-client";
import config from "../config";

export const SOCKET_EVENTS = {
    NOTIFICATION_NEW: "notification:new",
    NOTIFICATION_READ: "notification:read",
    NOTIFICATION_READ_ALL: "notification:read-all",
    TASK_UPDATED: "task:updated",
    REQUEST_UPDATED: "request:updated",
};

let socket = null;

export function connectSocket() {
    if (socket?.connected || socket?.active) return socket;

    socket = io(config.socketUrl, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        autoConnect: true,
    });

    return socket;
}

export function getSocket() {
    return socket;
}

export function disconnectSocket() {
    if (!socket) return;
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
}

const socketClient = { connectSocket, getSocket, disconnectSocket, SOCKET_EVENTS };

export default socketClient;
