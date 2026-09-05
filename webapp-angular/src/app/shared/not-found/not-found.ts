import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../state/auth.store';

/** Catch-all 404 route */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './not-found.html',
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
