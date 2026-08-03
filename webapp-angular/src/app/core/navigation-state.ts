import { Router } from '@angular/router';

/** Reads navigation state */
export function readNavigationState<T extends object>(router: Router): Partial<T> {
  const fromNavigation = router.getCurrentNavigation()?.extras?.state as T | undefined;
  if (fromNavigation) return fromNavigation;

  const fromHistory = (typeof history === 'undefined' ? null : history.state) as
    | (T & { navigationId?: number })
    | null;

  return fromHistory ?? {};
}
