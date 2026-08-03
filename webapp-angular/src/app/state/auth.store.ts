import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiEnvelope, LoadStatus, User } from '../core/api.types';
import { ApiService, getErrorMessage } from '../core/api.service';
import { SessionExpiryService } from '../core/session-expiry.service';
import { SessionResetService } from '../core/session-reset.service';
import { Result, fail, ok } from '../shared/result';

interface AuthState {
  user: User | null;
  status: LoadStatus;
  checked: boolean;
  error: string | null;
  logoutPending: boolean;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  checked: false,
  error: null,
  logoutPending: false,
};

interface LoginCredentials {
  email_id: string;
  password: string;
  rememberMe: boolean;
}

/** Session or 2FA demand */
interface LoginResponse {
  user?: User;
  twoFactorRequired?: boolean;
  email?: string;
}

export interface LoginOutcome {
  user: User | null;
  twoFactorRequired: boolean;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(ApiService);
  private readonly reset = inject(SessionResetService);
  private readonly state = signal<AuthState>(initialState);

  readonly user = computed(() => this.state().user);
  readonly checked = computed(() => this.state().checked);
  readonly status = computed(() => this.state().status);
  readonly logoutPending = computed(() => this.state().logoutPending);
  readonly error = computed(() => this.state().error);

  constructor() {
    // Wiring avoids circular injection
    inject(SessionExpiryService).onExpired(() => this.sessionExpired());
  }

  async fetchCurrentUser(): Promise<Result<User | null>> {
    this.state.update((s) => ({ ...s, status: 'loading', error: null }));

    try {
      const body = await this.api.get<ApiEnvelope<{ user: User }>>('/auth/me');
      const user = body.data?.user ?? null;

      this.state.update((s) => ({ ...s, status: 'succeeded', user, checked: true }));
      return ok(user);
    } catch (error) {
      const message = getErrorMessage(error, 'Not authenticated');
      this.state.update((s) => ({
        ...s,
        status: 'failed',
        user: null,
        checked: true,
        error: message,
      }));
      return fail(message);
    }
  }

  async login(credentials: LoginCredentials): Promise<Result<LoginOutcome>> {
    this.state.update((s) => ({ ...s, status: 'loading', error: null }));

    try {
      const body = await this.api.post<ApiEnvelope<LoginResponse>>('/auth/login', credentials);

      /* No session yet */
      if (body.data?.twoFactorRequired) {
        this.state.update((s) => ({ ...s, status: 'idle', user: null }));
        return ok({
          user: null,
          twoFactorRequired: true,
          email: body.data?.email ?? credentials.email_id,
        });
      }

      const user = body.data?.user ?? null;

      this.state.update((s) => ({ ...s, status: 'succeeded', user, checked: true }));
      return ok({ user, twoFactorRequired: false });
    } catch (error) {
      const message = getErrorMessage(error, 'Login failed');
      this.state.update((s) => ({ ...s, status: 'failed', error: message }));
      return fail(message);
    }
  }

  /** Redeems second factor */
  async verifyTwoFactor(payload: {
    email_id: string;
    otp: string;
    rememberMe: boolean;
  }): Promise<Result<User | null>> {
    this.state.update((s) => ({ ...s, status: 'loading', error: null }));

    try {
      const body = await this.api.post<ApiEnvelope<{ user: User }>>('/auth/verify-2fa', payload);
      const user = body.data?.user ?? null;

      this.state.update((s) => ({ ...s, status: 'succeeded', user, checked: true }));
      return ok(user);
    } catch (error) {
      const message = getErrorMessage(error, 'Verification failed');
      this.state.update((s) => ({ ...s, status: 'failed', error: message }));
      return fail(message);
    }
  }

  async logout(): Promise<Result> {
    this.state.update((s) => ({ ...s, logoutPending: true }));

    try {
      await this.api.post('/auth/logout');
      this.state.update((s) => ({ ...s, logoutPending: false, user: null, checked: true }));
      this.reset.clear();
      return ok(undefined);
    } catch (error) {
      this.state.update((s) => ({ ...s, logoutPending: false }));
      return fail(getErrorMessage(error, 'Logout failed'));
    }
  }

  sessionExpired(): void {
    this.state.update((s) => ({ ...s, user: null, status: 'idle', checked: true }));
    // Same residue as logout
    this.reset.clear();
  }

  setUser(user: User | null): void {
    this.state.update((s) => ({ ...s, user }));
  }

  patchUser(patch: Partial<User>): void {
    this.state.update((s) => (s.user ? { ...s, user: { ...s.user, ...patch } } : s));
  }
}
