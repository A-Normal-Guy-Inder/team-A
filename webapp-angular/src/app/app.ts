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

  /**
   * Covers what <Suspense fallback={<Loader />}> used to: the wait on a lazy
   * route chunk, and now also the /auth/me probe the auth guard makes before it
   * lets a protected route through.
   */
  readonly navigating = signal(false);

  constructor() {
    warmBackend();

    /*
     * A page served from the back/forward cache is a frozen snapshot: no guard
     * re-runs, no request is re-issued, and the DOM is exactly as it was — which
     * after a logout means a fully rendered dashboard belonging to someone who
     * is no longer signed in. `persisted` is what distinguishes that restore
     * from a normal load, and it is the only moment we get to re-check.
     */
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

  /**
   * Asks the server who we are and, if the answer is nobody, leaves whatever
   * protected page was restored. Public pages are left alone — being signed out
   * on /login is the normal state, not something to redirect away from.
   */
  private async revalidateSession(): Promise<void> {
    if (!isProtectedUrl(this.router.url)) return;

    const result = await this.auth.fetchCurrentUser();
    if (result.ok && result.value) return;

    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
