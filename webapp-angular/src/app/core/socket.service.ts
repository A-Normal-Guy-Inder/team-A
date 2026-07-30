import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import config from './config';

export const SOCKET_EVENTS = {
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_READ_ALL: 'notification:read-all',
  TASK_UPDATED: 'task:updated',
  REQUEST_UPDATED: 'request:updated',
} as const;

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (this.socket?.connected || this.socket?.active) return this.socket;

    this.socket = io(config.socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      autoConnect: true,
    });

    return this.socket;
  }

  get current(): Socket | null {
    return this.socket;
  }

  disconnect(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
  }
}
