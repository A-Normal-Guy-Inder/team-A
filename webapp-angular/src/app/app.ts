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

  /**
   * Covers what <Suspense fallback={<Loader />}> used to: the wait on a lazy
   * route chunk, and now also the /auth/me probe the auth guard makes before it
   * lets a protected route through.
   */
  readonly navigating = signal(false);

  constructor() {
    warmBackend();

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
}
