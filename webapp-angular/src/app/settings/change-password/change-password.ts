import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PasswordInput } from '../../shared/password-input/password-input';
import { ApiService, getErrorMessage } from '../../core/api.service';
import { ToastService } from '../../core/toast/toast.service';
import { checkPasswordStrength } from '../../shared/validation';

@Component({
  selector: 'app-change-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PasswordInput],
  templateUrl: './change-password.html',
})
export class ChangePassword {
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly toasts = inject(ToastService);

  /** 1: prove you know the old password, 2: choose the new one. */
  readonly step = signal(1);
  readonly loading = signal(false);

  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');

  /**
   * Leaves without changing anything — no request is sent from here at all.
   *
   * The typed passwords are cleared first. They are only in component state,
   * which this navigation tears down, but wiping them explicitly means a
   * cancel never depends on that happening.
   */
  handleCancel(): void {
    if (this.loading()) return;

    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.step.set(1);

    this.router.navigate(['/Dashboard', 'settings']);
  }

  async handleVerifyPassword(): Promise<void> {
    if (!this.currentPassword()) {
      this.toasts.error('Please enter your current password');
      return;
    }

    try {
      this.loading.set(true);
      await this.api.post('/user/reverify-password', { password: this.currentPassword() });
      this.toasts.success('Password verified');
      this.step.set(2);
    } catch (error) {
      this.toasts.error(getErrorMessage(error, 'Verification failed'));
    } finally {
      this.loading.set(false);
    }
  }

  async handleChangePassword(): Promise<void> {
    if (this.newPassword() !== this.confirmPassword()) {
      this.toasts.error('Passwords do not match');
      return;
    }
    if (this.newPassword() === this.currentPassword()) {
      this.toasts.error('New password must be different from current password.');
      return;
    }

    const strength = checkPasswordStrength(this.newPassword());
    if (!strength.isStrong) {
      this.toasts.error(strength.message);
      return;
    }

    try {
      this.loading.set(true);
      await this.api.put('/user/change-password', {
        current_password: this.currentPassword(),
        new_password: this.newPassword(),
      });

      this.toasts.success('Password changed successfully');
      this.router.navigate(['/Dashboard', 'settings']);
    } catch (error) {
      this.toasts.error(getErrorMessage(error, 'Password change failed'));
    } finally {
      this.loading.set(false);
    }
  }
}
