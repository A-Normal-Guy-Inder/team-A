import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TimeoutError, firstValueFrom, timeout } from 'rxjs';
import config from './config';

/** Promise-based HttpClient wrapper */
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

/** Drops empty params */
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

    // Status 0: unreachable/CORS
    if (error.status === 0) return 'Cannot reach the server. Please check your connection.';

    return error.message || fallback;
  }

  if (error instanceof Error) return error.message || fallback;

  return fallback;
}

/** Startup warm-up; failure ignored */
export function warmBackend(): Promise<void> {
  const healthUrl = config.apiUrl.replace(/\/api$/, '') + '/health';
  return fetch(healthUrl, { credentials: 'include', cache: 'no-store' }).then(
    () => undefined,
    () => undefined,
  );
}
