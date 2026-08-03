import { Injectable, inject } from '@angular/core';
import { NotificationsStore } from '../state/notifications.store';
import { RequestsStore } from '../state/requests.store';
import { TasksStore } from '../state/tasks.store';
import { UiStore } from '../state/ui.store';

/** Clears stores; not AuthStore */
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

/* Defensive; nothing stored today */
function clearWebStorage(): void {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    // Storage unavailable
  }
}
