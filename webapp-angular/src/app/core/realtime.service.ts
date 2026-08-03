import { DestroyRef, Injectable, effect, inject } from '@angular/core';
import { SOCKET_EVENTS, SocketService } from './socket.service';
import { NotificationsStore } from '../state/notifications.store';
import { AppNotification } from './api.types';

export interface RealtimeHandlers {
  onTaskUpdated?: (payload: unknown) => void;
  onRequestUpdated?: (payload: unknown) => void;
}

/** Socket feed subscription */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly sockets = inject(SocketService);
  private readonly notifications = inject(NotificationsStore);

  connect(userId: () => string | undefined, handlers: RealtimeHandlers): void {
    const destroyRef = inject(DestroyRef);
    let teardown: (() => void) | null = null;

    const disconnect = () => {
      teardown?.();
      teardown = null;
    };

    effect(() => {
      const id = userId();

      disconnect();
      if (!id) return;

      const socket = this.sockets.connect();

      const onConnect = () => this.notifications.setConnected(true);
      const onDisconnect = () => this.notifications.setConnected(false);
      const onNotification = (payload: AppNotification) => this.notifications.received(payload);
      const onRead = (payload: { _id?: string; unreadCount?: number }) =>
        this.notifications.readRemotely(payload);
      const onReadAll = () => this.notifications.allReadRemotely();
      const onTaskUpdated = (payload: unknown) => handlers.onTaskUpdated?.(payload);
      const onRequestUpdated = (payload: unknown) => handlers.onRequestUpdated?.(payload);

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, onNotification);
      socket.on(SOCKET_EVENTS.NOTIFICATION_READ, onRead);
      socket.on(SOCKET_EVENTS.NOTIFICATION_READ_ALL, onReadAll);
      socket.on(SOCKET_EVENTS.TASK_UPDATED, onTaskUpdated);
      socket.on(SOCKET_EVENTS.REQUEST_UPDATED, onRequestUpdated);

      teardown = () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, onNotification);
        socket.off(SOCKET_EVENTS.NOTIFICATION_READ, onRead);
        socket.off(SOCKET_EVENTS.NOTIFICATION_READ_ALL, onReadAll);
        socket.off(SOCKET_EVENTS.TASK_UPDATED, onTaskUpdated);
        socket.off(SOCKET_EVENTS.REQUEST_UPDATED, onRequestUpdated);
        this.sockets.disconnect();
        this.notifications.setConnected(false);
      };
    });

    destroyRef.onDestroy(disconnect);
  }
}
