import { Component, inject, signal } from '@angular/core';
import {
  Event as RouterEvent,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { Loader } from './shared/loader/loader';
import { ToastContainer } from './core/toast/toast-container';
import { warmBackend } from './core/api.service';
import { AuthStore } from './state/auth.store';
import { isProtectedUrl } from './app.routes';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Loader, ToastContainer],
  template: `
    <app-toast-container />
    @if (navigating()) {
      <app-loader />
    }
    <router-outlet />
  `,
})
export class App {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStore);

  /** Loader for pending navigation */
  readonly navigating = signal(false);

  constructor() {
    warmBackend();

    /* BFCache restore; re-check session */
    window.addEventListener('pageshow', (event) => {
      if ((event as PageTransitionEvent).persisted) void this.revalidateSession();
    });

    this.router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationStart) this.navigating.set(true);
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.navigating.set(false);
      }
    });
  }

  /** Leaves protected pages */
  private async revalidateSession(): Promise<void> {
    if (!isProtectedUrl(this.router.url)) return;

    const result = await this.auth.fetchCurrentUser();
    if (result.ok && result.value) return;

    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
