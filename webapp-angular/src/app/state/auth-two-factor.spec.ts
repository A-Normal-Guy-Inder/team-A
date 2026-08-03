import { TestBed } from '@angular/core/testing';
import { ApiService } from '../core/api.service';
import { AuthStore } from './auth.store';

/* Password alone insufficient */
describe('AuthStore two-factor login', () => {
  function setup(responses: Record<string, unknown>) {
    const calls: { path: string; body: unknown }[] = [];

    const api = {
      post: async (path: string, body: unknown) => {
        calls.push({ path, body });
        if (path in responses) return responses[path];
        throw new Error(`unexpected POST ${path}`);
      },
      get: async () => ({ data: {} }),
    };

    TestBed.configureTestingModule({
      providers: [AuthStore, { provide: ApiService, useValue: api }],
    });

    return { store: TestBed.inject(AuthStore), calls };
  }

  const credentials = { email_id: 'a@b.com', password: 'pw', rememberMe: true };

  it('reports the pending step and grants no session when 2FA is required', async () => {
    const { store } = setup({
      '/auth/login': { data: { twoFactorRequired: true, email: 'a@b.com' } },
    });

    const result = await store.login(credentials);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.twoFactorRequired).toBe(true);
    expect(result.value.email).toBe('a@b.com');
    expect(result.value.user).toBeNull();

    // Guards read this
    expect(store.user()).toBeNull();
  });

  it('completes the session only once the code is redeemed', async () => {
    const user = { _id: 'u1', first_name: 'Ada' };
    const { store, calls } = setup({
      '/auth/login': { data: { twoFactorRequired: true, email: 'a@b.com' } },
      '/auth/verify-2fa': { data: { user } },
    });

    await store.login(credentials);
    expect(store.user()).toBeNull();

    const verified = await store.verifyTwoFactor({
      email_id: 'a@b.com',
      otp: '123456',
      rememberMe: true,
    });

    expect(verified.ok).toBe(true);
    expect(store.user()).toEqual(user);
    expect(store.checked()).toBe(true);

    // rememberMe survives the detour
    expect(calls[1].path).toBe('/auth/verify-2fa');
    expect((calls[1].body as { rememberMe: boolean }).rememberMe).toBe(true);
  });

  it('signs in directly when the account has no second factor', async () => {
    const user = { _id: 'u2', first_name: 'Grace' };
    const { store, calls } = setup({ '/auth/login': { data: { user } } });

    const result = await store.login(credentials);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.twoFactorRequired).toBe(false);
    expect(result.value.user).toEqual(user);
    expect(store.user()).toEqual(user);
    expect(calls).toHaveLength(1);
  });

  it('surfaces a rejected code as a failure and leaves the session empty', async () => {
    const { store } = setup({
      '/auth/login': { data: { twoFactorRequired: true, email: 'a@b.com' } },
    });

    await store.login(credentials);

    const verified = await store.verifyTwoFactor({
      email_id: 'a@b.com',
      otp: '000000',
      rememberMe: false,
    });

    expect(verified.ok).toBe(false);
    expect(store.user()).toBeNull();
  });
});
