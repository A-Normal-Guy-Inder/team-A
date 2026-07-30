/*
 * Production overrides. Set `apiUrl` / `socketUrl` here when the API does not
 * live on the same host as the app — the session cookie is SameSite=Lax, so the
 * two must agree or the browser drops it (see the warning in core/config.ts).
 */
export const environment = {
  production: true,
  apiUrl: '',
  socketUrl: '',
  apiPort: '5000',
  pageSize: 12,
  apiTimeout: 90000,
};
