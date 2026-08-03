import { environment } from '../../environments/environment';

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

// Cookie host must match
function defaultApiOrigin(): string {
  if (typeof window === 'undefined') return `http://localhost:${environment.apiPort}`;
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:${environment.apiPort}`;
}

const apiUrl = stripTrailingSlash(environment.apiUrl || `${defaultApiOrigin()}/api`);

const socketUrl = stripTrailingSlash(environment.socketUrl || apiUrl.replace(/\/api$/, ''));

if (!environment.production && typeof window !== 'undefined') {
  try {
    const apiHost = new URL(apiUrl).hostname;
    if (apiHost !== window.location.hostname) {
      console.warn(
        `[config] API host "${apiHost}" differs from the page host ` +
          `"${window.location.hostname}". The browser treats these as different ` +
          `sites and will discard the SameSite=Lax session cookie, so requests ` +
          `will fail with "Not authorized, no token". Open the app on ` +
          `"${apiHost}" or set apiUrl in src/environments/environment.ts.`,
      );
    }
  } catch {
    // Malformed URL fails later
  }
}

export const config = {
  apiUrl,
  socketUrl,
  pageSize: environment.pageSize,
  // High: free-tier cold starts
  apiTimeout: environment.apiTimeout,
  isProduction: environment.production,
};

export default config;
