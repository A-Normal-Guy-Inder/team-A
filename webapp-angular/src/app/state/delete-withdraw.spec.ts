import { TestBed } from '@angular/core/testing';
import { ApiService } from '../core/api.service';
import { TasksStore } from './tasks.store';
import { RequestsStore } from './requests.store';

/* List must update immediately */
describe('deleting a task', () => {
  function setup(fail = false) {
    const calls: string[] = [];

    TestBed.configureTestingModule({
      providers: [
        TasksStore,
        {
          provide: ApiService,
          useValue: {
            get: async () => ({
              data: [{ _id: 't1', title: 'One' }, { _id: 't2', title: 'Two' }],
              meta: { total: 2, page: 1, limit: 12, totalPages: 1 },
            }),
            delete: async (path: string) => {
              calls.push(path);
              if (fail) throw new Error('nope');
              return {};
            },
          },
        },
      ],
    });

    return { store: TestBed.inject(TasksStore), calls };
  }

  it('removes the row and decrements the total', async () => {
    const { store, calls } = setup();
    await store.fetchMyTasks();
    expect(store.myTasks().items).toHaveLength(2);

    const result = await store.deleteTask('t1');

    expect(result.ok).toBe(true);
    expect(calls).toEqual(['/task/t1']);
    expect(store.myTasks().items.map((t) => t._id)).toEqual(['t2']);
    expect(store.myTasks().meta.total).toBe(1);
  });

  it('leaves the list untouched when the delete fails', async () => {
    const { store } = setup(true);
    await store.fetchMyTasks();

    const result = await store.deleteTask('t1');

    expect(result.ok).toBe(false);
    expect(store.myTasks().items).toHaveLength(2);
    expect(store.saving()).toBe(false);
  });
});

describe('withdrawing an application', () => {
  function setup(fail = false) {
    const calls: string[] = [];

    TestBed.configureTestingModule({
      providers: [
        RequestsStore,
        {
          provide: ApiService,
          useValue: {
            get: async () => ({
              data: [
                { requestId: 'r1', status: 'pending', taskTitle: 'One' },
                { requestId: 'r2', status: 'accepted', taskTitle: 'Two' },
              ],
              meta: { total: 2, page: 1, limit: 12, totalPages: 1 },
            }),
            patch: async (path: string) => {
              calls.push(path);
              if (fail) throw new Error('nope');
              return {};
            },
          },
        },
      ],
    });

    return { store: TestBed.inject(RequestsStore), calls };
  }

  it('keeps the row and marks it withdrawn', async () => {
    const { store, calls } = setup();
    await store.fetchSent();

    const result = await store.withdraw('r1');

    expect(result.ok).toBe(true);
    expect(calls).toEqual(['/requests/r1/withdraw']);

    // Kept, not deleted
    expect(store.sent().items).toHaveLength(2);
    expect(store.sent().items.find((r) => r.requestId === 'r1')?.status).toBe('withdrawn');
    expect(store.sent().items.find((r) => r.requestId === 'r2')?.status).toBe('accepted');
  });

  it('clears the in-flight marker once it succeeds', async () => {
    const { store } = setup();
    await store.fetchSent();

    await store.withdraw('r1');

    expect(store.actionInFlight()['r1']).toBeUndefined();
  });

  it('leaves the row pending and unblocked when the call fails', async () => {
    const { store } = setup(true);
    await store.fetchSent();

    const result = await store.withdraw('r1');

    expect(result.ok).toBe(false);
    // Still retryable
    expect(store.actionInFlight()['r1']).toBeUndefined();
    expect(store.sent().items.find((r) => r.requestId === 'r1')?.status).toBe('pending');
  });
});
