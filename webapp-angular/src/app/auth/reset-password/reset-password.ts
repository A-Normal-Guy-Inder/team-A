import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Loader } from '../../shared/loader/loader';
import { IconEye, IconEyeOff } from '../../shared/icons';
import { ApiService, getErrorMessage } from '../../core/api.service';
import { ApiEnvelope } from '../../core/api.types';
import { ToastService } from '../../core/toast/toast.service';
import { readNavigationState } from '../../core/navigation-state';
import { checkPasswordStrength } from '../../shared/validation';

@Component({
  selector: 'app-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Loader, IconEye, IconEyeOff],
  templateUrl: './reset-password.html',
})
export class ResetPassword {
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly toasts = inject(ToastService);

  readonly email = signal('');
  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  constructor() {
    const state = readNavigationState<{ email?: string }>(this.router);
    this.email.set(state.email ?? '');

    // No email: restart journey
    if (!state.email) {
      this.toasts.error('Session expired. Please try again.');
      this.router.navigate(['/ForgotPassword'], { replaceUrl: true });
    }
  }

  async handleReset(): Promise<void> {
    if (this.loading()) return;

    const cleanPassword = this.password().trim();
    const cleanConfirm = this.confirmPassword().trim();

    if (!cleanPassword || !cleanConfirm) {
      this.toasts.error('All fields are required');
      return;
    }
    if (cleanPassword !== cleanConfirm) {
      this.toasts.error('Passwords do not match');
      return;
    }

    const strength = checkPasswordStrength(cleanPassword);
    if (!strength.isStrong) {
      this.toasts.error(strength.message);
      return;
    }

    try {
      this.loading.set(true);
      const body = await this.api.post<ApiEnvelope<unknown>>('/auth/reset-password', {
        email_id: this.email(),
        password: cleanPassword,
      });

      this.toasts.success(body?.message || 'Password reset successful.');
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      this.toasts.error(getErrorMessage(error, 'Reset failed'));
    } finally {
      this.loading.set(false);
    }
  }

  onConfirmKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.handleReset();
  }
}
