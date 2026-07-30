import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Loader } from '../../shared/loader/loader';
import { ApiService, getErrorMessage } from '../../core/api.service';
import { ApiEnvelope } from '../../core/api.types';
import { ToastService } from '../../core/toast/toast.service';
import { isValidEmail } from '../../shared/validation';
import { OTP_FLOW } from '../../shared/auth-flows';

@Component({
  selector: 'app-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Loader],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly toasts = inject(ToastService);

  readonly email = signal('');
  readonly loading = signal(false);

  async handleSendOtp(): Promise<void> {
    if (this.loading()) return;

    const cleanEmail = this.email().trim();
    if (!isValidEmail(cleanEmail)) {
      this.toasts.error('Enter a valid email address');
      return;
    }

    try {
      this.loading.set(true);
      const body = await this.api.post<ApiEnvelope<unknown>>('/auth/forgot-password', {
        email_id: cleanEmail,
      });

      this.toasts.success(body?.message || 'If email exists, OTP has been sent.');
      this.router.navigate(['/verify'], {
        state: { email: cleanEmail, flow: OTP_FLOW.PASSWORD_RESET },
      });
    } catch (error) {
      this.toasts.error(getErrorMessage(error, 'Could not send the OTP. Please try again.'));
    } finally {
      this.loading.set(false);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.handleSendOtp();
  }
}
