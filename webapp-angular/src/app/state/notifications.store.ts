import { Injectable, computed, inject, signal, untracked } from '@angular/core';
import { ApiEnvelope, AppNotification, ListMeta, LoadStatus } from '../core/api.types';
import { ApiService, getErrorMessage } from '../core/api.service';
import { Result, fail, ok } from '../shared/result';

const PAGE_SIZE = 20;

type NotificationsMeta = Pick<
  ListMeta,
  'page' | 'limit' | 'total' | 'totalPages' | 'hasNextPage'
> & { unreadCount?: number };

interface NotificationsState {
  items: AppNotification[];
  unreadCount: number;
  meta: NotificationsMeta;
  status: LoadStatus;
  error: string | null;
  connected: boolean;
}

const initialState = (): NotificationsState => ({
  items: [],
  unreadCount: 0,
  meta: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0, hasNextPage: false },
  status: 'idle',
  error: null,
  connected: false,
});

@Injectable({ providedIn: 'root' })
export class NotificationsStore {
  private readonly api = inject(ApiService);
  private readonly state = signal<NotificationsState>(initialState());

  readonly items = computed(() => this.state().items);
  readonly unreadCount = computed(() => this.state().unreadCount);
  readonly meta = computed(() => this.state().meta);
  readonly connected = computed(() => this.state().connected);

  async fetch({ page = 1, status = 'unread' } = {}): Promise<Result<void>> {
    this.state.update((s) => ({ ...s, status: 'loading', error: null }));

    try {
      const body = await this.api.get<ApiEnvelope<AppNotification[]>>('/notifications', {
        page,
        limit: PAGE_SIZE,
        status,
      });

      const items = body.data ?? [];
      const meta = (body.meta ?? {}) as Partial<NotificationsMeta>;

      this.state.update((s) => ({
        ...s,
        status: 'succeeded',
        // Page 1 replaces; later pages append — this is the "load older" path.
        items: page > 1 ? [...s.items, ...items] : items,
        meta: { ...s.meta, ...meta, page },
        unreadCount: typeof meta.unreadCount === 'number' ? meta.unreadCount : s.unreadCount,
      }));
      return ok(undefined);
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to load notifications');
      this.state.update((s) => ({ ...s, status: 'failed', error: message }));
      return fail(message);
    }
  }

  async markRead(notificationId: string): Promise<Result<void>> {
    try {
      const body = await this.api.put<ApiEnvelope<{ unreadCount?: number }>>(
        `/notifications/${notificationId}/read`,
      );
      const serverCount = body.data?.unreadCount;

      this.state.update((s) => ({
        ...s,
        items: s.items.map((item) =>
          item._id === notificationId ? { ...item, read: true } : item,
        ),
        unreadCount:
          typeof serverCount === 'number' ? serverCount : Math.max(0, s.unreadCount - 1),
      }));
      return ok(undefined);
    } catch (error) {
      return fail(getErrorMessage(error, 'Failed to mark notification as read'));
    }
  }

  async markAllRead(): Promise<Result<void>> {
    try {
      await this.api.put('/notifications/read-all');
      this.allReadRemotely();
      return ok(undefined);
    } catch (error) {
      return fail(getErrorMessage(error, 'Failed to mark notifications as read'));
    }
  }

  /* --- socket-driven updates --- */

  received(incoming: AppNotification | null | undefined): void {
    if (!incoming?._id) return;
    // Untracked, for the reason given on TasksStore.snapshot.
    if (untracked(this.state).items.some((item) => item._id === incoming._id)) return;

    this.state.update((s) => ({
      ...s,
      items: [incoming, ...s.items],
      unreadCount: incoming.read ? s.unreadCount : s.unreadCount + 1,
      meta: { ...s.meta, total: s.meta.total + 1 },
    }));
  }

  readRemotely(payload: { _id?: string; unreadCount?: number } | null | undefined): void {
    const { _id, unreadCount } = payload || {};

    this.state.update((s) => ({
      ...s,
      items: s.items.map((item) => (item._id === _id ? { ...item, read: true } : item)),
      unreadCount: typeof unreadCount === 'number' ? unreadCount : s.unreadCount,
    }));
  }

  allReadRemotely(): void {
    this.state.update((s) => ({
      ...s,
      items: s.items.map((item) => ({ ...item, read: true })),
      unreadCount: 0,
    }));
  }

  setConnected(connected: boolean): void {
    this.state.update((s) => ({ ...s, connected }));
  }

  reset(): void {
    this.state.set(initialState());
  }
}
