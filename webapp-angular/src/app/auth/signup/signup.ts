import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Loader } from '../../shared/loader/loader';
import { IconEye, IconEyeOff } from '../../shared/icons';
import { ApiService, getErrorMessage } from '../../core/api.service';
import { ApiEnvelope } from '../../core/api.types';
import { ToastService } from '../../core/toast/toast.service';
import { checkPasswordStrength, isValidEmail, isValidPhone } from '../../shared/validation';
import { OTP_FLOW } from '../../shared/auth-flows';

@Component({
  selector: 'app-signup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, Loader, IconEye, IconEyeOff],
  templateUrl: './signup.html',
})
export class Signup {
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly toasts = inject(ToastService);

  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly phoneNumber = signal('');
  readonly emailId = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly showPassword = signal(false);

  async handleSignup(): Promise<void> {
    if (this.loading()) return;

    const payload = {
      first_name: this.firstName().trim(),
      last_name: this.lastName().trim(),
      phone_number: this.phoneNumber().trim(),
      email_id: this.emailId().trim().toLowerCase(),
      password: this.password().trim(),
    };

    if (Object.values(payload).some((value) => !value)) {
      this.toasts.error('All fields are required');
      return;
    }
    if (!isValidEmail(payload.email_id)) {
      this.toasts.error('Enter a valid email address');
      return;
    }
    if (!isValidPhone(payload.phone_number)) {
      this.toasts.error('Enter a valid 10-digit phone number');
      return;
    }

    const strength = checkPasswordStrength(payload.password);
    if (!strength.isStrong) {
      this.toasts.error(strength.message);
      return;
    }

    try {
      this.loading.set(true);
      const body = await this.api.post<ApiEnvelope<unknown>>('/auth/register', payload);

      this.toasts.success(body?.message || 'Registration successful');
      this.router.navigate(['/verify'], {
        state: { email: payload.email_id, flow: OTP_FLOW.SIGNUP },
      });
    } catch (error) {
      this.toasts.error(getErrorMessage(error, 'Registration failed'));
    } finally {
      this.loading.set(false);
    }
  }
}
