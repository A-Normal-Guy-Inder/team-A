import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SessionExpiryService } from './session-expiry.service';

/*
 * Auth endpoints answer 401 as a normal outcome — /auth/me is how the app asks
 * "am I logged in?", and a wrong password on /auth/login is the user's problem,
 * not an expired session. Tearing down the session on those would log people out
 * of a session they never had.
 */
const SILENT_401_PATHS = ['/auth/me', '/auth/login', '/auth/logout'];

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionExpiry = inject(SessionExpiryService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        if (!SILENT_401_PATHS.some((path) => req.url.includes(path))) {
          sessionExpiry.notify();
        }
      }

      return throwError(() => error);
    }),
  );
};
