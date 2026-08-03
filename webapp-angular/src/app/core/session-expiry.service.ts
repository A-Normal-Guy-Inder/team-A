import { Injectable } from '@angular/core';

/** Breaks interceptor/auth-store cycle */
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
