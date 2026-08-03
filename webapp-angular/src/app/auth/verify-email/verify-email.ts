import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Loader } from '../../shared/loader/loader';
import { ApiService, getErrorMessage } from '../../core/api.service';
import { ApiEnvelope } from '../../core/api.types';
import { ToastService } from '../../core/toast/toast.service';
import { AuthStore } from '../../state/auth.store';
import { readNavigationState } from '../../core/navigation-state';
import { OTP_FLOW, OtpNavigationState } from '../../shared/auth-flows';

const RESEND_COOLDOWN_SECONDS = 60;

@Component({
  selector: 'app-verify-email',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Loader],
  templateUrl: './verify-email.html',
})
export class VerifyEmail {
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthStore);
  private readonly toasts = inject(ToastService);

  readonly otp = signal('');
  readonly loading = signal(false);
  readonly cooldown = signal(0);

  readonly email = signal<string>('');
  private readonly flow = signal<string | undefined>(undefined);
  private rememberMe = false;

  /** The second factor is a login step, so the screen words itself differently. */
  readonly isTwoFactor = computed(() => this.flow() === OTP_FLOW.TWO_FACTOR);

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const state = readNavigationState<OtpNavigationState>(this.router);
    this.email.set(state.email ?? '');
    this.flow.set(state.flow);
    this.rememberMe = Boolean(state.rememberMe);

    // Landing here without an email means the screen was opened directly rather
    // than reached through one of its three entry points; send the visitor back
    // to whichever of those it was supposed to be.
    if (!state.email) {
      this.router.navigate([state.flow === OTP_FLOW.SIGNUP ? '/signup' : '/login'], {
        replaceUrl: true,
      });
    }

    inject(DestroyRef).onDestroy(() => this.stopTimer());
  }

  async handleVerify(): Promise<void> {
    if (this.loading()) return;

    const cleanOtp = this.otp().trim();
    if (!/^\d{4,6}$/.test(cleanOtp)) {
      this.toasts.error('Enter a valid OTP');
      return;
    }

    /*
     * The second factor goes to a different endpoint and ends somewhere else:
     * it establishes the session outright, so it lands on the dashboard rather
     * than sending the user back to log in again.
     */
    if (this.isTwoFactor()) {
      this.loading.set(true);
      const result = await this.auth.verifyTwoFactor({
        email_id: this.email(),
        otp: cleanOtp,
        rememberMe: this.rememberMe,
      });
      this.loading.set(false);

      if (!result.ok) {
        this.toasts.error(result.error);
        return;
      }

      this.toasts.success('Login successful');
      this.router.navigate(['/Dashboard'], { replaceUrl: true });
      return;
    }

    try {
      this.loading.set(true);
      const body = await this.api.post<ApiEnvelope<unknown>>('/auth/verify-otp', {
        email_id: this.email(),
        otp: cleanOtp,
      });

      this.toasts.success(body?.message || 'OTP verified');

      // Only the forgot-password journey earns a password-reset grant from the
      // backend, so it is the only one allowed on to /ResetPassword. Every other
      // flow (including an unverified login) has just verified its account and
      // belongs back at the login screen.
      if (this.flow() === OTP_FLOW.PASSWORD_RESET) {
        this.router.navigate(['/ResetPassword'], {
          replaceUrl: true,
          state: { email: this.email() },
        });
      } else {
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    } catch (error) {
      this.toasts.error(getErrorMessage(error, 'Invalid OTP'));
    } finally {
      this.loading.set(false);
    }
  }

  async handleResend(): Promise<void> {
    if (this.loading() || this.cooldown() > 0) return;

    try {
      this.loading.set(true);
      const body = await this.api.post<ApiEnvelope<unknown>>('/auth/resend-otp', {
        email_id: this.email(),
      });

      this.toasts.success(body?.message || 'OTP resent');
      this.startCooldown();
    } catch (error) {
      const message = getErrorMessage(error, 'Something went wrong');

      if (message.toLowerCase().includes('already verified')) {
        this.toasts.success('Email already verified. Please login.');
        this.router.navigate(['/login'], { replaceUrl: true });
      } else {
        this.toasts.error(message);
      }
    } finally {
      this.loading.set(false);
    }
  }

  /** Keeps the field to digits, rewriting the element so a stripped character cannot linger. */
  onOtpInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    input.value = digits;
    this.otp.set(digits);
  }

  onOtpKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.handleVerify();
  }

  private startCooldown(): void {
    this.stopTimer();
    this.cooldown.set(RESEND_COOLDOWN_SECONDS);

    this.timer = setInterval(() => {
      const next = this.cooldown() - 1;
      this.cooldown.set(next);
      if (next <= 0) this.stopTimer();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
