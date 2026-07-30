import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'warn' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  /** Set while the exit animation plays; the row stays mounted until it finishes. */
  leaving: boolean;
}

export const TOAST_AUTO_CLOSE_MS = 4000;
/** Must stay in step with the .toast--leaving animation in toast-container.ts. */
const EXIT_MS = 260;

interface Countdown {
  handle: ReturnType<typeof setTimeout>;
  startedAt: number;
  remaining: number;
}

/**
 * Stands in for react-toastify.
 *
 * The React app pulled in a library for this; three hundred lines of dependency
 * for four call shapes did not survive the port, so the queue lives here and
 * ToastContainer renders it. The API is deliberately the same — `toast.success`
 * becomes `toasts.success` — so the call sites read identically.
 *
 * Dismissal is two-phase: `dismiss` flags the toast as leaving so its exit
 * animation can run, and only then is it dropped from the list. Hovering pauses
 * the countdown, so a message cannot expire while it is being read.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly countdowns = new Map<number, Countdown>();

  readonly toasts = signal<Toast[]>([]);

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  warn(message: string): void {
    this.push('warn', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  /** Starts the exit animation, then removes the toast once it has played. */
  dismiss(id: number): void {
    this.clearCountdown(id);

    const existing = this.toasts().find((toast) => toast.id === id);
    if (!existing || existing.leaving) return;

    this.toasts.update((current) =>
      current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)),
    );

    setTimeout(() => {
      this.toasts.update((current) => current.filter((toast) => toast.id !== id));
    }, EXIT_MS);
  }

  pause(id: number): void {
    const countdown = this.countdowns.get(id);
    if (!countdown) return;

    clearTimeout(countdown.handle);
    countdown.remaining = Math.max(0, countdown.remaining - (Date.now() - countdown.startedAt));
  }

  resume(id: number): void {
    const countdown = this.countdowns.get(id);
    if (!countdown) return;

    countdown.startedAt = Date.now();
    countdown.handle = setTimeout(() => this.dismiss(id), countdown.remaining);
  }

  private push(kind: ToastKind, message: string): void {
    const id = this.nextId++;

    this.toasts.update((current) => [...current, { id, kind, message, leaving: false }]);

    this.countdowns.set(id, {
      handle: setTimeout(() => this.dismiss(id), TOAST_AUTO_CLOSE_MS),
      startedAt: Date.now(),
      remaining: TOAST_AUTO_CLOSE_MS,
    });
  }

  private clearCountdown(id: number): void {
    const countdown = this.countdowns.get(id);
    if (!countdown) return;

    clearTimeout(countdown.handle);
    this.countdowns.delete(id);
  }
}
