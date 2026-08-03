import { Injectable, inject } from '@angular/core';
import { NotificationsStore } from '../state/notifications.store';
import { RequestsStore } from '../state/requests.store';
import { TasksStore } from '../state/tasks.store';
import { UiStore } from '../state/ui.store';

/**
 * Wipes everything the previous session left behind.
 *
 * The session token itself is an httpOnly cookie the server clears, so there is
 * nothing for JavaScript to delete there. What does linger is the data already
 * fetched with it — tasks, requests, notifications — sitting in the stores. If
 * that survives a logout, the next paint of the dashboard shows the old user's
 * content before any request comes back to correct it.
 *
 * Deliberately does not touch AuthStore: this is called *from* it.
 */
@Injectable({ providedIn: 'root' })
export class SessionResetService {
  private readonly ui = inject(UiStore);
  private readonly tasks = inject(TasksStore);
  private readonly requests = inject(RequestsStore);
  private readonly notifications = inject(NotificationsStore);

  clear(): void {
    this.ui.reset();
    this.tasks.reset();
    this.requests.reset();
    this.notifications.reset();
    clearWebStorage();
  }
}

/*
 * Nothing is deliberately kept in web storage today — the session lives in an
 * httpOnly cookie. This runs anyway so that anything added later, or left over
 * from the React build this replaced, cannot outlive the session that created
 * it. The app owns its origin, so clearing wholesale is safe.
 */
function clearWebStorage(): void {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). Nothing to
    // clear in that case either.
  }
}
