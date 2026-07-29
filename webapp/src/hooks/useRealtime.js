import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from "../services/socket";
import {
    allNotificationsReadRemotely,
    notificationReadRemotely,
    notificationReceived,
    setSocketConnected,
} from "../features/notifications/notificationsSlice";

/**
 * Opens the realtime channel for a signed-in user and keeps the store in sync.
 *
 * This replaces the dashboard's 10-second polling loop. Beyond removing a
 * request every 10s per open tab, it means a notification appears the instant
 * it is created rather than up to 10s later.
 *
 * @param {string|undefined} userId  Connect only once the session is known.
 * @param {object} handlers          Optional `onTaskUpdated` / `onRequestUpdated`.
 */
export default function useRealtime(userId, handlers = {}) {
    const dispatch = useDispatch();

    // Handlers are read through a ref so a caller passing an inline object does
    // not tear the socket down and rebuild it on every render.
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() => {
        if (!userId) return undefined;

        const socket = connectSocket();

        const onConnect = () => dispatch(setSocketConnected(true));
        const onDisconnect = () => dispatch(setSocketConnected(false));
        const onNotification = (payload) => dispatch(notificationReceived(payload));
        const onRead = (payload) => dispatch(notificationReadRemotely(payload));
        const onReadAll = () => dispatch(allNotificationsReadRemotely());
        const onTaskUpdated = (payload) => handlersRef.current.onTaskUpdated?.(payload);
        const onRequestUpdated = (payload) => handlersRef.current.onRequestUpdated?.(payload);

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, onNotification);
        socket.on(SOCKET_EVENTS.NOTIFICATION_READ, onRead);
        socket.on(SOCKET_EVENTS.NOTIFICATION_READ_ALL, onReadAll);
        socket.on(SOCKET_EVENTS.TASK_UPDATED, onTaskUpdated);
        socket.on(SOCKET_EVENTS.REQUEST_UPDATED, onRequestUpdated);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, onNotification);
            socket.off(SOCKET_EVENTS.NOTIFICATION_READ, onRead);
            socket.off(SOCKET_EVENTS.NOTIFICATION_READ_ALL, onReadAll);
            socket.off(SOCKET_EVENTS.TASK_UPDATED, onTaskUpdated);
            socket.off(SOCKET_EVENTS.REQUEST_UPDATED, onRequestUpdated);
            disconnectSocket();
            dispatch(setSocketConnected(false));
        };
    }, [userId, dispatch]);
}
