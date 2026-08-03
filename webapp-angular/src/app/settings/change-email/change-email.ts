import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PasswordInput } from '../../shared/password-input/password-input';
import { ApiService, getErrorMessage } from '../../core/api.service';
import { ApiEnvelope, User } from '../../core/api.types';
import { ToastService } from '../../core/toast/toast.service';
import { AuthStore } from '../../state/auth.store';
import { isValidEmail } from '../../shared/validation';

const RESEND_COOLDOWN_SECONDS = 60;

@Component({
  selector: 'app-change-email',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PasswordInput],
  templateUrl: './change-email.html',
})
export class ChangeEmail {
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthStore);
  private readonly toasts = inject(ToastService);

  /** 1: confirm identity, 2: name the new address, 3: prove you own it. */
  readonly step = signal(1);
  readonly loading = signal(false);
  readonly timer = signal(0);

  readonly password = signal('');
  readonly newEmail = signal('');
  readonly otp = signal('');

  private interval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopTimer());
  }

  async handleVerifyPassword(): Promise<void> {
    if (!this.password()) {
      this.toasts.error('Please enter your current password');
      return;
    }

    try {
      this.loading.set(true);
      await this.api.post('/user/reverify-password', { password: this.password() });
      this.toasts.success('Password verified');
      this.step.set(2);
    } catch (error) {
      this.toasts.error(getErrorMessage(error, 'Verification failed'));
    } finally {
      this.loading.set(false);
    }
  }

  async handleSendOtp(): Promise<void> {
    if (!isValidEmail(this.newEmail())) {
      this.toasts.error('Enter a valid email address');
      return;
    }

    try {
      this.loading.set(true);
      await this.api.post('/user/change-email/send-otp', { newEmail: this.newEmail().trim() });
      this.toasts.success('OTP sent to new email');
      this.step.set(3);
      this.startCooldown();
    } catch (error) {
      this.toasts.error(getErrorMessage(error, 'Failed to send OTP'));
    } finally {
      this.loading.set(false);
    }
  }

  async handleVerifyOtp(): Promise<void> {
    if (!/^\d{4,6}$/.test(this.otp().trim())) {
      this.toasts.error('Enter a valid OTP');
      return;
    }

    try {
      this.loading.set(true);
      const body = await this.api.post<ApiEnvelope<{ user: User }>>(
        '/user/change-email/verify-otp',
        { otp: this.otp().trim() },
      );

      if (body?.data?.user) this.auth.patchUser(body.data.user);
      this.toasts.success('Email updated successfully');

      // Back to the section this was launched from, rather than the feed.
      this.router.navigate(['/Dashboard', 'settings']);
    } catch (error) {
      this.toasts.error(getErrorMessage(error, 'Failed to verify OTP'));
    } finally {
      this.loading.set(false);
    }
  }

  async handleResendOtp(): Promise<void> {
    if (this.timer() > 0) return;

    try {
      this.loading.set(true);
      await this.api.post('/user/change-email/resend-otp');
      this.toasts.success('OTP resent');
      this.startCooldown();
    } catch (error) {
      this.toasts.error(getErrorMessage(error, 'Failed to resend OTP'));
    } finally {
      this.loading.set(false);
    }
  }

  private startCooldown(): void {
    this.stopTimer();
    this.timer.set(RESEND_COOLDOWN_SECONDS);

    this.interval = setInterval(() => {
      const next = this.timer() - 1;
      this.timer.set(next);
      if (next <= 0) this.stopTimer();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
