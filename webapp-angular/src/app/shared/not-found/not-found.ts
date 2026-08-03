import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../state/auth.store';

/** Catch-all 404 route */
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
    /* Probe sets button label */
    if (!this.auth.checked() && this.auth.status() !== 'loading') {
      void this.auth.fetchCurrentUser();
    }
  }

  goHome(): void {
    this.router.navigate([this.signedIn() ? '/Dashboard' : '/login']);
  }
}
