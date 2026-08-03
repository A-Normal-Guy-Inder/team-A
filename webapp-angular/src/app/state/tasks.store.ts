import { Injectable, computed, inject, signal, untracked } from '@angular/core';
import { ApiEnvelope, ListQuery, Task } from '../core/api.types';
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

interface TasksState {
  feed: ListState<Task>;
  myTasks: ListState<Task>;
  saving: boolean;
  error: string | null;
}

const initialState = (): TasksState => ({
  feed: emptyList<Task>(),
  myTasks: emptyList<Task>(),
  saving: false,
  error: null,
});

@Injectable({ providedIn: 'root' })
export class TasksStore {
  private readonly api = inject(ApiService);
  private readonly state = signal<TasksState>(initialState());

  readonly feed = computed(() => this.state().feed);
  readonly myTasks = computed(() => this.state().myTasks);
  readonly saving = computed(() => this.state().saving);

  /* Untracked; prevents loops */
  private snapshot(): TasksState {
    return untracked(this.state);
  }

  async fetchFeed(overrides: Partial<ListQuery> = {}): Promise<Result<void>> {
    return this.fetchList('feed', '/task/feed', overrides, 'Failed to load the feed');
  }

  async fetchMyTasks(overrides: Partial<ListQuery> = {}): Promise<Result<void>> {
    return this.fetchList('myTasks', '/task/me', overrides, 'Failed to load your tasks');
  }

  /** Shared list body */
  private async fetchList(
    key: 'feed' | 'myTasks',
    path: string,
    overrides: Partial<ListQuery>,
    fallbackMessage: string,
  ): Promise<Result<void>> {
    const query: ListQuery = { ...this.snapshot()[key].query, ...overrides };

    this.state.update((s) => ({ ...s, [key]: listPending(s[key]) }));

    try {
      const body = await this.api.get<ApiEnvelope<Task[]>>(
        path,
        buildListParams(query, { category: true }),
      );

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

  async createTask(formData: FormData): Promise<Result<Task | null>> {
    this.state.update((s) => ({ ...s, saving: true, error: null }));

    try {
      const body = await this.api.post<ApiEnvelope<{ task: Task }>>('/task/create', formData);
      this.state.update((s) => ({ ...s, saving: false }));
      return ok(body.data?.task ?? null);
    } catch (error) {
      const message = getErrorMessage(error, 'Task creation failed');
      this.state.update((s) => ({ ...s, saving: false, error: message }));
      return fail(message);
    }
  }

  async updateTask(taskId: string, formData: FormData): Promise<Result<Task | null>> {
    this.state.update((s) => ({ ...s, saving: true, error: null }));

    try {
      const body = await this.api.put<ApiEnvelope<{ task: Task }>>(`/task/${taskId}`, formData);
      const updated = body.data?.task ?? null;

      this.state.update((s) => ({
        ...s,
        saving: false,
        myTasks: updated
          ? {
              ...s.myTasks,
              items: s.myTasks.items.map((task) =>
                task._id === updated._id ? { ...task, ...updated } : task,
              ),
            }
          : s.myTasks,
      }));
      return ok(updated);
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to update task');
      this.state.update((s) => ({ ...s, saving: false, error: message }));
      return fail(message);
    }
  }

  /** Deletes task, updates list */
  async deleteTask(taskId: string): Promise<Result<void>> {
    this.state.update((s) => ({ ...s, saving: true, error: null }));

    try {
      await this.api.delete(`/task/${taskId}`);

      this.state.update((s) => ({
        ...s,
        saving: false,
        myTasks: {
          ...s.myTasks,
          items: s.myTasks.items.filter((task) => task._id !== taskId),
          meta: { ...s.myTasks.meta, total: Math.max(0, (s.myTasks.meta.total ?? 1) - 1) },
        },
        feed: { ...s.feed, items: s.feed.items.filter((task) => task._id !== taskId) },
      }));
      return ok(undefined);
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to delete task');
      this.state.update((s) => ({ ...s, saving: false, error: message }));
      return fail(message);
    }
  }

  setFeedQuery(patch: Partial<ListQuery>): void {
    this.state.update((s) => ({
      ...s,
      feed: { ...s.feed, query: { ...s.feed.query, ...patch, page: patch.page ?? 1 } },
    }));
  }

  setMyTasksQuery(patch: Partial<ListQuery>): void {
    this.state.update((s) => ({
      ...s,
      myTasks: { ...s.myTasks, query: { ...s.myTasks.query, ...patch, page: patch.page ?? 1 } },
    }));
  }

  /** Optimistic "Requested" flip */
  markTaskRequested(taskId: string): void {
    this.state.update((s) => ({
      ...s,
      feed: {
        ...s.feed,
        items: s.feed.items.map((task) =>
          task._id === taskId ? { ...task, hasRequested: true } : task,
        ),
      },
    }));
  }

  reset(): void {
    this.state.set(initialState());
  }
}
