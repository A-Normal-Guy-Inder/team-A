import { Injectable } from '@angular/core';

/**
 * Breaks the cycle between the HTTP interceptor and the auth store.
 *
 * The interceptor has to tell the auth store a session died; the auth store
 * makes HTTP calls. Injecting one into the other directly would be circular, so
 * the interceptor publishes here and the store subscribes on construction —
 * the same job `setUnauthorizedHandler` did in the React app's api.js.
 */
@Injectable({ providedIn: 'root' })
export class SessionExpiryService {
  private handler: (() => void) | null = null;

  onExpired(handler: () => void): void {
    this.handler = handler;
  }

  notify(): void {
    this.handler?.();
  }
}
