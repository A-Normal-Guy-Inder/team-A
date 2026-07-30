import { Injectable, computed, inject, signal, untracked } from '@angular/core';
import { ApiEnvelope, HelpRequest, ListQuery } from '../core/api.types';
import { ApiService, getErrorMessage } from '../core/api.service';
import {
  ListState,
  buildListParams,
  emptyList,
  listFulfilled,
  listPending,
  listRejected,
  unwrapList,
} from '../shared/pagination';
import { Result, fail, ok } from '../shared/result';

interface RequestsState {
  received: ListState<HelpRequest>;
  sent: ListState<HelpRequest>;
  sending: boolean;
  /** requestId -> the status being written, so each row can disable itself. */
  actionInFlight: Record<string, string>;
}

const initialState = (): RequestsState => {
  const received = emptyList<HelpRequest>();
  return {
    received: { ...received, meta: { ...received.meta, pendingCount: 0 } },
    sent: emptyList<HelpRequest>(),
    sending: false,
    actionInFlight: {},
  };
};

@Injectable({ providedIn: 'root' })
export class RequestsStore {
  private readonly api = inject(ApiService);
  private readonly state = signal<RequestsState>(initialState());

  readonly received = computed(() => this.state().received);
  readonly sent = computed(() => this.state().sent);
  readonly pendingCount = computed(() => this.state().received.meta.pendingCount || 0);
  readonly sending = computed(() => this.state().sending);
  readonly actionInFlight = computed(() => this.state().actionInFlight);

  /** Untracked state read — see the note on TasksStore.snapshot. */
  private snapshot(): RequestsState {
    return untracked(this.state);
  }

  async fetchReceived(overrides: Partial<ListQuery> = {}): Promise<Result<void>> {
    return this.fetchList(
      'received',
      '/requests/received',
      overrides,
      'Failed to load received requests',
    );
  }

  async fetchSent(overrides: Partial<ListQuery> = {}): Promise<Result<void>> {
    return this.fetchList('sent', '/requests/sent', overrides, 'Failed to load sent requests');
  }

  private async fetchList(
    key: 'received' | 'sent',
    path: string,
    overrides: Partial<ListQuery>,
    fallbackMessage: string,
  ): Promise<Result<void>> {
    const query: ListQuery = { ...this.snapshot()[key].query, ...overrides };

    this.state.update((s) => ({ ...s, [key]: listPending(s[key]) }));

    try {
      const body = await this.api.get<ApiEnvelope<HelpRequest[]>>(path, buildListParams(query));

      this.state.update((s) => ({
        ...s,
        [key]: listFulfilled(s[key], { ...unwrapList(body), query }),
      }));
      return ok(undefined);
    } catch (error) {
      const message = getErrorMessage(error, fallbackMessage);
      this.state.update((s) => ({ ...s, [key]: listRejected(s[key], message) }));
      return fail(message);
    }
  }

  async sendRequest(taskId: string, description: string): Promise<Result<{ requestId?: string }>> {
    this.state.update((s) => ({ ...s, sending: true }));

    try {
      const body = await this.api.post<ApiEnvelope<{ requestId: string }>>(
        `/requests/${taskId}/send`,
        { description },
      );
      this.state.update((s) => ({ ...s, sending: false }));
      return ok({ requestId: body.data?.requestId });
    } catch (error) {
      this.state.update((s) => ({ ...s, sending: false }));
      return fail(getErrorMessage(error, 'Failed to send request. Please try again.'));
    }
  }

  async respond(requestId: string, status: string): Promise<Result<void>> {
    this.state.update((s) => ({
      ...s,
      actionInFlight: { ...s.actionInFlight, [requestId]: status },
    }));

    try {
      await this.api.put(`/requests/${requestId}`, { status });

      this.state.update((s) => ({
        ...s,
        actionInFlight: omit(s.actionInFlight, requestId),
        received: {
          ...s.received,
          items: s.received.items.map((item) =>
            item.requestId === requestId ? { ...item, status } : item,
          ),
          meta: {
            ...s.received.meta,
            pendingCount: Math.max(0, (s.received.meta.pendingCount ?? 0) - 1),
          },
        },
      }));
      return ok(undefined);
    } catch (error) {
      this.state.update((s) => ({ ...s, actionInFlight: omit(s.actionInFlight, requestId) }));
      return fail(getErrorMessage(error, `Failed to ${status.replace('ed', '')} request`));
    }
  }

  setReceivedQuery(patch: Partial<ListQuery>): void {
    this.state.update((s) => ({
      ...s,
      received: { ...s.received, query: { ...s.received.query, ...patch, page: patch.page ?? 1 } },
    }));
  }

  setSentQuery(patch: Partial<ListQuery>): void {
    this.state.update((s) => ({
      ...s,
      sent: { ...s.sent, query: { ...s.sent.query, ...patch, page: patch.page ?? 1 } },
    }));
  }

  reset(): void {
    this.state.set(initialState());
  }
}

function omit(source: Record<string, string>, key: string): Record<string, string> {
  const { [key]: _removed, ...rest } = source;
  return rest;
}
