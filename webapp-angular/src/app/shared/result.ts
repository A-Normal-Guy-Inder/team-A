/**
 * What a store action hands back to a component.
 *
 * Redux Toolkit's thunks returned an action object the caller inspected with
 * `createTask.rejected.match(result)` and then read `result.payload` off. There
 * is no dispatch pipeline here, so the same two outcomes are modelled directly:
 * a discriminated union the caller narrows with `if (!result.ok)`.
 */
export type Result<T = void> = { ok: true; value: T } | { ok: false; error: string };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const fail = <T = never>(error: string): Result<T> => ({ ok: false, error });
