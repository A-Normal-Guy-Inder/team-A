import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { SessionResetService } from './session-reset.service';
import { AuthStore } from '../state/auth.store';
import { NotificationsStore } from '../state/notifications.store';
import { RequestsStore } from '../state/requests.store';
import { TasksStore } from '../state/tasks.store';
import { UiStore } from '../state/ui.store';
import { PROTECTED_PATH_PREFIXES, isProtectedUrl } from '../app.routes';

/*
 * Logging out has to leave nothing behind that a restored page could render.
 * The token is an httpOnly cookie the server clears, but everything already
 * fetched with it lives in the stores — if that survives, the next paint of a
 * back-navigated dashboard shows the previous user's content.
 */
describe('session teardown', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        SessionResetService,
        UiStore,
        TasksStore,
        RequestsStore,
        NotificationsStore,
        { provide: Router, useValue: { navigate: () => {} } },
        {
          provide: ApiService,
          useValue: {
            get: async () => ({ data: {}, meta: {} }),
            post: async () => ({ data: {} }),
          },
        },
      ],
    });

    return {
      auth: TestBed.inject(AuthStore),
      ui: TestBed.inject(UiStore),
      notifications: TestBed.inject(NotificationsStore),
    };
  }

  it('clears fetched session data on logout', async () => {
    const { auth, ui, notifications } = setup();

    ui.syncActivePage('Settings');
    ui.setSearchTerm('plumbing');
    expect(ui.activePage()).toBe('Settings');

    await auth.logout();

    expect(auth.user()).toBeNull();
    expect(ui.activePage()).toBe('Feed');
    expect(ui.searchTerm()).toBe('');
    expect(notifications.items()).toEqual([]);
    expect(notifications.unreadCount()).toBe(0);
  });

  it('clears the same state when a session expires mid-use', () => {
    const { auth, ui } = setup();

    ui.syncActivePage('My Tasks');
    auth.sessionExpired();

    expect(auth.user()).toBeNull();
    expect(ui.activePage()).toBe('Feed');
  });

  it('empties web storage', async () => {
    const { auth } = setup();

    localStorage.setItem('leftover', 'from the old session');
    sessionStorage.setItem('also-leftover', 'x');

    await auth.logout();

    expect(localStorage.getItem('leftover')).toBeNull();
    expect(sessionStorage.getItem('also-leftover')).toBeNull();
  });
});

/*
 * A BFCache restore re-checks the session, but only where being signed out
 * actually matters — bouncing someone off /login for not being logged in would
 * be absurd.
 */
describe('protected URL detection', () => {
  it('derives its list from the guarded routes', () => {
    expect(PROTECTED_PATH_PREFIXES).toContain('/Dashboard');
    expect(PROTECTED_PATH_PREFIXES).toContain('/change-email');
    expect(PROTECTED_PATH_PREFIXES).toContain('/change-password');
  });

  it('recognises protected pages, including dashboard sections', () => {
    expect(isProtectedUrl('/Dashboard')).toBe(true);
    expect(isProtectedUrl('/Dashboard/my-tasks')).toBe(true);
    expect(isProtectedUrl('/Dashboard/settings?x=1')).toBe(true);
    expect(isProtectedUrl('/change-password')).toBe(true);
  });

  it('leaves public pages alone', () => {
    expect(isProtectedUrl('/login')).toBe(false);
    expect(isProtectedUrl('/signup')).toBe(false);
    expect(isProtectedUrl('/verify')).toBe(false);
    expect(isProtectedUrl('/404')).toBe(false);
    expect(isProtectedUrl('/')).toBe(false);
  });

  it('does not match on a shared prefix', () => {
    expect(isProtectedUrl('/Dashboards-of-someone-else')).toBe(false);
  });
});
