import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SessionExpiryService } from './session-expiry.service';

/* 401 here is normal */
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
