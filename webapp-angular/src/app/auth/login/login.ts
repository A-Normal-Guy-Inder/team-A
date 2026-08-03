import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Loader } from '../../shared/loader/loader';
import { IconEye, IconEyeOff } from '../../shared/icons';
import { ToastService } from '../../core/toast/toast.service';
import { AuthStore } from '../../state/auth.store';
import { isValidEmail } from '../../shared/validation';
import { OTP_FLOW } from '../../shared/auth-flows';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, Loader, IconEye, IconEyeOff],
  templateUrl: './login.html',
})
export class Login {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStore);
  private readonly toasts = inject(ToastService);

  readonly showPassword = signal(false);
  readonly email = signal('');
  readonly password = signal('');
  readonly remember = signal(false);
  readonly loading = signal(false);

  async handleLogin(): Promise<void> {
    if (this.loading()) return;

    const email = this.email().trim();
    const pass = this.password().trim();

    if (!email || !pass) {
      this.toasts.error('Please enter email and password');
      return;
    }
    if (!isValidEmail(email)) {
      this.toasts.error('Please enter a valid email address');
      return;
    }

    this.loading.set(true);

    const result = await this.auth.login({
      email_id: email,
      password: pass,
      rememberMe: this.remember(),
    });

    this.loading.set(false);

    if (!result.ok) {
      const message = result.error || 'Login failed';
      this.toasts.error(message);

      // Unverified: continue to OTP
      if (message.toLowerCase().includes('verif')) {
        this.router.navigate(['/verify'], {
          state: { email, flow: OTP_FLOW.LOGIN_UNVERIFIED },
        });
      }
      return;
    }

    // 2FA: OTP screen next
    if (result.value.twoFactorRequired) {
      this.toasts.success('Verification code sent to your email');
      this.router.navigate(['/verify'], {
        state: {
          email: result.value.email ?? email,
          flow: OTP_FLOW.TWO_FACTOR,
          rememberMe: this.remember(),
        },
      });
      return;
    }

    this.toasts.success('Login successful');
    this.router.navigate(['/Dashboard'], { replaceUrl: true });
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.handleLogin();
  }
}
