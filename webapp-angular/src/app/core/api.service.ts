import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TimeoutError, firstValueFrom, timeout } from 'rxjs';
import config from './config';

/**
 * Thin wrapper over HttpClient that reproduces the axios instance the React app
 * used: a fixed base URL, credentials on every call, and a shared timeout.
 *
 * Requests are handed back as Promises rather than Observables. The stores that
 * consume them are written as async methods — the direct descendants of the
 * createAsyncThunk bodies — and a Promise keeps that code readable. Anything
 * that genuinely needs a stream (the socket feed) does not go through here.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.send(
      this.http.get<T>(this.url(path), {
        withCredentials: true,
        params: toHttpParams(params),
      }),
    );
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.send(
      this.http.post<T>(this.url(path), body ?? {}, { withCredentials: true }),
    );
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.send(this.http.put<T>(this.url(path), body ?? {}, { withCredentials: true }));
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.send(this.http.patch<T>(this.url(path), body ?? {}, { withCredentials: true }));
  }

  delete<T>(path: string): Promise<T> {
    return this.send(this.http.delete<T>(this.url(path), { withCredentials: true }));
  }

  private url(path: string): string {
    return `${config.apiUrl}${path}`;
  }

  private send<T>(request$: import('rxjs').Observable<T>): Promise<T> {
    return firstValueFrom(request$.pipe(timeout(config.apiTimeout)));
  }
}

/**
 * Drops empty params so the query string matches what the backend saw before —
 * axios omitted undefined keys, and the original `toQueryParams` stripped null
 * and "" as well.
 */
export function toHttpParams(params: Record<string, unknown> = {}): HttpParams {
  let httpParams = new HttpParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    httpParams = httpParams.set(key, String(value));
  }

  return httpParams;
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error instanceof TimeoutError) return 'The request timed out. Please try again.';

  if (error instanceof HttpErrorResponse) {
    const serverMessage = (error.error as { message?: string } | null)?.message;
    if (serverMessage) return serverMessage;

    // Angular reports an unreachable host or a CORS rejection as status 0.
    if (error.status === 0) return 'Cannot reach the server. Please check your connection.';

    return error.message || fallback;
  }

  if (error instanceof Error) return error.message || fallback;

  return fallback;
}

/**
 * Fired once at startup so an idle free-tier backend begins waking while the
 * user is still reading the page, instead of on their first login attempt.
 * Failure is expected and ignored — this is a warm-up, not a health gate.
 */
export function warmBackend(): Promise<void> {
  const healthUrl = config.apiUrl.replace(/\/api$/, '') + '/health';
  return fetch(healthUrl, { credentials: 'include', cache: 'no-store' }).then(
    () => undefined,
    () => undefined,
  );
}
