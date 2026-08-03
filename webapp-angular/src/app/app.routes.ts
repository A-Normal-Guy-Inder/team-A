import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard } from './core/auth.guards';
import { Login } from './auth/login/login';
import { Signup } from './auth/signup/signup';
import { VerifyEmail } from './auth/verify-email/verify-email';
import { ForgotPassword } from './auth/forgot-password/forgot-password';
import { ResetPassword } from './auth/reset-password/reset-password';
import { NotFound } from './shared/not-found/not-found';

/*
 * Paths keep the exact casing the React router used — /Dashboard, /ForgotPassword,
 * /ResetPassword. Angular matches case-sensitively, and links already in the wild
 * (password-reset emails, bookmarks) point at those spellings.
 *
 * The three routes that were React.lazy() imports stay lazy here as loadComponent;
 * the auth screens are eager, since one of them is always the first paint.
 */
export const routes: Routes = [
  { path: '', component: Login, canActivate: [publicOnlyGuard] },
  { path: 'login', component: Login, canActivate: [publicOnlyGuard] },
  { path: 'signup', component: Signup, canActivate: [publicOnlyGuard] },
  { path: 'ForgotPassword', component: ForgotPassword, canActivate: [publicOnlyGuard] },

  { path: 'verify', component: VerifyEmail },
  { path: 'ResetPassword', component: ResetPassword },

  /*
   * The open section is a URL segment rather than component state, so a reload
   * or a shared link reopens the page the user was on instead of dropping them
   * back on the feed. Bare /Dashboard resolves to the feed.
   */
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

  /*
   * An unknown address gets a 404, not a redirect to the login form. Sending a
   * signed-in user to /login for a mistyped URL reads as "you have been signed
   * out", which is both alarming and untrue.
   */
  { path: '404', component: NotFound },
  { path: '**', component: NotFound },
];

/*
 * The URL prefixes that require a session, derived from the table above rather
 * than written out again — a route added with a guard is covered automatically,
 * and the two cannot drift apart.
 */
export const PROTECTED_PATH_PREFIXES = routes
  .filter((route) => route.canActivate?.includes(authGuard))
  .map((route) => `/${(route.path ?? '').split('/:')[0]}`);

export function isProtectedUrl(url: string): boolean {
  const path = url.split('?')[0].split('#')[0];

  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
