import { Signal, effect, signal } from '@angular/core';

/**
 * The `useDebouncedValue` hook, as a signal.
 *
 * Must be called from an injection context — it registers an effect that
 * restarts the timer on every source change and clears it on teardown.
 */
export function debouncedSignal<T>(source: Signal<T>, delay = 400): Signal<T> {
  const debounced = signal(source());

  effect((onCleanup) => {
    const value = source();
    const timer = setTimeout(() => debounced.set(value), delay);
    onCleanup(() => clearTimeout(timer));
  });

  return debounced.asReadonly();
}
