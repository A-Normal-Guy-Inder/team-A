import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'warn' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  /** Set during exit animation */
  leaving: boolean;
}

export const TOAST_AUTO_CLOSE_MS = 4000;
/** Must match .toast--leaving */
const EXIT_MS = 260;

interface Countdown {
  handle: ReturnType<typeof setTimeout>;
  startedAt: number;
  remaining: number;
}

/** Toast queue; two-phase dismissal */
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

  /** Animates out, then removes */
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
