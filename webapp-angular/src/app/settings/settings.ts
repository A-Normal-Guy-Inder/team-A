import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UpdateProfile } from './update-profile/update-profile';
import { ApiService, getErrorMessage } from '../core/api.service';
import { ApiEnvelope, User } from '../core/api.types';
import { ToastService } from '../core/toast/toast.service';
import { AuthStore } from '../state/auth.store';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, UpdateProfile],
  template: `
    <div class="settings-container">
      <app-update-profile />

      <div class="settings-card">
        <h3>Change Credentials</h3>
        <div class="credentials-actions">
          <button class="settings-save-btn" (click)="go('/change-email')">Change Email</button>
          <button class="settings-save-btn" (click)="go('/change-password')">Change Password</button>
        </div>
      </div>

      <div class="settings-card">
        <h3>Two-Factor Authentication</h3>

        <div class="twofactor-status">
          <span class="twofactor-badge" [class.is-on]="enabled()">
            {{ enabled() ? 'Enabled' : 'Disabled' }}
          </span>
          <p class="settings-hint">
            {{
              enabled()
                ? 'A one-time code is emailed to you each time you sign in.'
                : 'Add a one-time emailed code to every sign-in.'
            }}
          </p>
        </div>

        @if (confirming()) {
          <!-- Both directions require password -->
          <label class="settings-hint" for="twofactor-password">
            Enter your password to {{ enabled() ? 'disable' : 'enable' }} two-factor
            authentication
          </label>
          <input
            id="twofactor-password"
            type="password"
            name="twofactor_password"
            placeholder="Current password"
            autocomplete="current-password"
            [ngModel]="password()"
            (ngModelChange)="password.set($event)"
            (keydown.enter)="submit()"
          />
          <div class="credentials-actions">
            <button class="settings-save-btn" (click)="submit()" [disabled]="saving()">
              {{ saving() ? 'Saving...' : 'Confirm' }}
            </button>
            <button class="settings-cancel-btn" (click)="cancel()" [disabled]="saving()">
              Cancel
            </button>
          </div>
        } @else {
          <button class="settings-save-btn" (click)="confirming.set(true)">
            {{ enabled() ? 'Disable' : 'Enable' }} Two-Factor Authentication
          </button>
        }
      </div>
    </div>
  `,
})
export class Settings {
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthStore);
  private readonly toasts = inject(ToastService);

  readonly enabled = computed(() => Boolean(this.auth.user()?.['two_factor_enabled']));
  readonly confirming = signal(false);
  readonly password = signal('');
  readonly saving = signal(false);

  go(path: string): void {
    this.router.navigate([path]);
  }

  cancel(): void {
    this.confirming.set(false);
    this.password.set('');
  }

  async submit(): Promise<void> {
    if (this.saving()) return;

    const password = this.password();
    if (!password) {
      this.toasts.error('Please enter your password');
      return;
    }

    // Read before patchUser flips
    const next = !this.enabled();

    try {
      this.saving.set(true);
      const body = await this.api.put<ApiEnvelope<{ user: User }>>('/user/two-factor', {
        enabled: next,
        password,
      });

      if (body?.data?.user) this.auth.patchUser(body.data.user);

      this.toasts.success(
        body?.message ||
          (next ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled'),
      );
      this.cancel();
    } catch (error) {
      this.toasts.error(getErrorMessage(error, 'Could not update two-factor authentication'));
    } finally {
      this.saving.set(false);
    }
  }
}
