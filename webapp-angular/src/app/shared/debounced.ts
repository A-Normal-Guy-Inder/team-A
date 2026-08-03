import { Signal, effect, signal } from '@angular/core';

/** Needs injection context */
export function debouncedSignal<T>(source: Signal<T>, delay = 400): Signal<T> {
  const debounced = signal(source());

  effect((onCleanup) => {
    const value = source();
    const timer = setTimeout(() => debounced.set(value), delay);
    onCleanup(() => clearTimeout(timer));
  });

  return debounced.asReadonly();
}
