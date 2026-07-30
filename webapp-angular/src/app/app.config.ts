import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { unauthorizedInterceptor } from './core/unauthorized.interceptor';

/*
 * No zone.js: this app runs zoneless, so every piece of component state that the
 * template reads is a signal. A plain field mutated in a click handler would not
 * repaint.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    provideHttpClient(withInterceptors([unauthorizedInterceptor])),
  ],
};
