import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard } from './core/auth.guards';
import { Login } from './auth/login/login';
import { Signup } from './auth/signup/signup';
import { VerifyEmail } from './auth/verify-email/verify-email';
import { ForgotPassword } from './auth/forgot-password/forgot-password';
import { ResetPassword } from './auth/reset-password/reset-password';
import { NotFound } from './shared/not-found/not-found';

/* Casing is load-bearing */
export const routes: Routes = [
  { path: '', component: Login, canActivate: [publicOnlyGuard] },
  { path: 'login', component: Login, canActivate: [publicOnlyGuard] },
  { path: 'signup', component: Signup, canActivate: [publicOnlyGuard] },
  { path: 'ForgotPassword', component: ForgotPassword, canActivate: [publicOnlyGuard] },

  { path: 'verify', component: VerifyEmail },
  { path: 'ResetPassword', component: ResetPassword },

  /* Section lives in URL */
  { path: 'Dashboard', pathMatch: 'full', redirectTo: 'Dashboard/feed' },
  {
    path: 'Dashboard/:section',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'change-email',
    canActivate: [authGuard],
    loadComponent: () => import('./settings/change-email/change-email').then((m) => m.ChangeEmail),
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./settings/change-password/change-password').then((m) => m.ChangePassword),
  },

  /* Unknown address: 404 */
  { path: '404', component: NotFound },
  { path: '**', component: NotFound },
];

/* Derived from guarded routes */
export const PROTECTED_PATH_PREFIXES = routes
  .filter((route) => route.canActivate?.includes(authGuard))
  .map((route) => `/${(route.path ?? '').split('/:')[0]}`);

export function isProtectedUrl(url: string): boolean {
  const path = url.split('?')[0].split('#')[0];

  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
