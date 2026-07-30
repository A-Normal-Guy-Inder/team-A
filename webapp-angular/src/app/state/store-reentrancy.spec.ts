import { effect, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ApiService } from '../core/api.service';
import { TasksStore } from './tasks.store';
import { RequestsStore } from './requests.store';

/*
 * Guards the defect that locked up the browser on the dashboard.
 *
 * Dashboard reloads its list from an `effect` that watches the active page and
 * the search term. A store action reads current state to build its query and
 * then writes that state back. If the read is tracked, the effect gains a
 * dependency on the store, the write re-triggers the effect, and it fetches
 * forever — the tab pegs a core and stops responding to input.
 *
 * The fix is that store actions read through an untracked snapshot. These tests
 * assert the observable consequence: calling an action from inside an effect
 * issues exactly one request.
 */
describe('store actions called from a reactive context', () => {
  function setup() {
    let calls = 0;

    const api = {
      get: async () => {
        calls += 1;
        return { data: [], meta: {} };
      },
    };

    TestBed.configureTestingModule({
      providers: [TasksStore, RequestsStore, { provide: ApiService, useValue: api }],
    });

    return { calls: () => calls };
  }

  /** Flushes effects and lets the in-flight promises settle, a few rounds over. */
  async function settle() {
    for (let i = 0; i < 3; i++) {
      TestBed.tick();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    TestBed.tick();
  }

  it('does not re-enter when TasksStore.fetchFeed runs inside an effect', async () => {
    const { calls } = setup();
    const store = TestBed.inject(TasksStore);
    const activePage = signal('Feed');

    TestBed.runInInjectionContext(() => {
      effect(() => {
        activePage();
        store.fetchFeed({ page: 1 });
      });
    });

    await settle();

    expect(calls()).toBe(1);
  });

  it('does not re-enter when RequestsStore.fetchReceived runs inside an effect', async () => {
    const { calls } = setup();
    const store = TestBed.inject(RequestsStore);
    const activePage = signal('Requests');

    TestBed.runInInjectionContext(() => {
      effect(() => {
        activePage();
        store.fetchReceived({ page: 1 });
      });
    });

    await settle();

    expect(calls()).toBe(1);
  });

  it('still refetches when a tracked dependency genuinely changes', async () => {
    const { calls } = setup();
    const store = TestBed.inject(TasksStore);
    const search = signal('');

    TestBed.runInInjectionContext(() => {
      effect(() => {
        const term = search();
        store.fetchFeed({ search: term, page: 1 });
      });
    });

    await settle();
    expect(calls()).toBe(1);

    // The untracked boundary must not deafen the effect to its real inputs.
    search.set('plumbing');
    await settle();

    expect(calls()).toBe(2);
  });
});
