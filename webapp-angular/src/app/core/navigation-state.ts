import { Router } from '@angular/router';

/**
 * Reads the state attached to a `router.navigate(..., { state })` call.
 *
 * This is the stand-in for react-router's `location.state`. During the
 * navigation that creates a component, `getCurrentNavigation()` holds the value;
 * afterwards — including across a reload, since the browser persists it — it is
 * only reachable through `history.state`. Checking both means a screen like
 * /verify still finds its email if the user refreshes.
 */
export function readNavigationState<T extends object>(router: Router): Partial<T> {
  const fromNavigation = router.getCurrentNavigation()?.extras?.state as T | undefined;
  if (fromNavigation) return fromNavigation;

  const fromHistory = (typeof history === 'undefined' ? null : history.state) as
    | (T & { navigationId?: number })
    | null;

  return fromHistory ?? {};
}
