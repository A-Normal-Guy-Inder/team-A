import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../state/auth.store';

/**
 * Shown for any URL the router does not recognise.
 *
 * The catch-all used to redirect to /login, which told a signed-in user with a
 * typo in the address bar that they had been signed out — and gave anyone else
 * a login form in place of an answer. A 404 says the one true thing: there is
 * nothing at this address.
 */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="notfound-container">
      <div class="notfound-card">
        <p class="notfound-code">404</p>
        <h1 class="notfound-title">Page not found</h1>
        <p class="notfound-text">
          The page you are looking for does not exist, or it may have been moved.
        </p>
        <button class="notfound-btn" (click)="goHome()">
          {{ signedIn() ? 'Back to dashboard' : 'Back to login' }}
        </button>
      </div>
    </div>
  `,
})
export class NotFound {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStore);

  readonly signedIn = this.auth.user;

  constructor() {
    /*
     * This route has no auth guard — it must render for anyone — so on a cold
     * load nothing has asked /auth/me yet and a signed-in visitor would be
     * offered "Back to login". Ask once, purely so the way out points somewhere
     * useful; the answer changes the label, never whether the page is shown.
     */
    if (!this.auth.checked() && this.auth.status() !== 'loading') {
      void this.auth.fetchCurrentUser();
    }
  }

  goHome(): void {
    this.router.navigate([this.signedIn() ? '/Dashboard' : '/login']);
  }
}
