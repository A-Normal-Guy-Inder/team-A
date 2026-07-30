import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../state/auth.store';

/**
 * Gate for the signed-in routes.
 *
 * ProtectedRoute rendered a loader while it asked /auth/me who the user was,
 * then swapped in the page or a redirect. A guard can simply await that answer
 * before the route activates — App shows the loader for the whole pending
 * navigation, so the visible behaviour is unchanged.
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (!auth.checked() && auth.status() !== 'loading') {
    await auth.fetchCurrentUser();
  }

  if (auth.user()) return true;

  /*
   * ProtectedRoute attached `state: { from }` to this redirect, but no screen
   * ever read it — the login handler always sends people to /Dashboard. A
   * UrlTree cannot carry navigation state anyway, so it is dropped rather than
   * reimplemented as a query parameter, which would change the login URL the
   * React app produced.
   */
  return router.createUrlTree(['/login']);
};

/**
 * Keeps a signed-in user off the login and signup screens.
 *
 * Deliberately does not trigger the /auth/me probe: PublicOnlyRoute only
 * redirected once the session had already been established elsewhere, so a cold
 * load of /login renders the form immediately rather than waiting on a request.
 */
export const publicOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (auth.checked() && auth.user()) return router.createUrlTree(['/Dashboard']);

  return true;
};
