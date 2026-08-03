import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../state/auth.store';

/** Gate for signed-in routes */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (!auth.checked() && auth.status() !== 'loading') {
    await auth.fetchCurrentUser();
  }

  if (auth.user()) return true;

  return router.createUrlTree(['/login']);
};

/** Blocks signed-in users */
export const publicOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (auth.checked() && auth.user()) return router.createUrlTree(['/Dashboard']);

  return true;
};
