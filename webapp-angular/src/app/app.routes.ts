import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard } from './core/auth.guards';
import { Login } from './auth/login/login';
import { Signup } from './auth/signup/signup';
import { VerifyEmail } from './auth/verify-email/verify-email';
import { ForgotPassword } from './auth/forgot-password/forgot-password';
import { ResetPassword } from './auth/reset-password/reset-password';

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

  {
    path: 'Dashboard',
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

  { path: '**', redirectTo: 'login' },
];
