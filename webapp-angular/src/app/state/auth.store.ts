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

/** /auth/login answers with either a session or a demand for a second factor. */
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
    // The interceptor cannot reach into a store that itself makes HTTP calls,
    // so it publishes through SessionExpiryService and the wiring lands here —
    // the counterpart to `setUnauthorizedHandler` in the React app's store.js.
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

      /*
       * A 2FA account gets no session here — the backend deliberately withholds
       * the cookie until the emailed code comes back. Leaving `user` null keeps
       * the guards treating this as signed-out, which is what it is.
       */
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

  /** Redeems the emailed second factor; on success the session cookie is set. */
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
    // An expired session leaves the same residue a logout does.
    this.reset.clear();
  }

  setUser(user: User | null): void {
    this.state.update((s) => ({ ...s, user }));
  }

  patchUser(patch: Partial<User>): void {
    this.state.update((s) => (s.user ? { ...s, user: { ...s.user, ...patch } } : s));
  }
}
