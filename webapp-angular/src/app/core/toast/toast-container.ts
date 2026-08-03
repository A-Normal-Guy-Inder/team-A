import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TOAST_AUTO_CLOSE_MS, ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-viewport" aria-live="polite" aria-atomic="false">
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="toast toast--{{ toast.kind }}"
          [class.toast--leaving]="toast.leaving"
          [style.--toast-duration]="durationVar"
          role="status"
          (mouseenter)="toasts.pause(toast.id)"
          (mouseleave)="toasts.resume(toast.id)"
        >
          <span class="toast__icon" aria-hidden="true">{{ icon(toast.kind) }}</span>
          <p class="toast__body">{{ toast.message }}</p>
          <button
            type="button"
            class="toast__close"
            aria-label="Dismiss notification"
            (click)="toasts.dismiss(toast.id)"
          >
            ✕
          </button>
          <span class="toast__progress" aria-hidden="true"></span>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-viewport {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      min-height: 64px;
      max-width: 500px;
      padding: 0.85rem 2.75rem 0.85rem 0.9rem;
      overflow: hidden;
      border-radius: 12px;
      background: #fff;
      color: #1e293b;
      font-size: 14px;
      box-shadow:
        0 10px 30px rgb(15 23 42 / 0.13),
        0 3px 8px rgb(15 23 42 / 0.07);
      /* Slight overshoot on entry */
      animation: toast-in 0.42s cubic-bezier(0.21, 1.13, 0.36, 1) both;
    }

    .toast--leaving {
      /* Must match EXIT_MS */
      animation: toast-out 0.26s cubic-bezier(0.4, 0, 1, 0.6) forwards;
    }

    .toast__icon {
      flex-shrink: 0;
      display: grid;
      place-items: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
      animation: toast-pop 0.45s 0.1s cubic-bezier(0.2, 1.3, 0.4, 1) both;
    }

    .toast__body {
      flex: 1 1 auto;
      margin: 0;
      line-height: 1.35;
    }

    .toast__close {
      position: absolute;
      top: 50%;
      right: 12px;
      transform: translateY(-50%);
      width: 22px;
      height: 22px;
      display: grid;
      place-items: center;
      border-radius: 6px;
      font-size: 11px;
      color: #64748b;
      opacity: 0.55;
      transition:
        opacity 0.15s ease,
        background-color 0.15s ease;
    }

    .toast__close:hover {
      opacity: 1;
      background: rgb(15 23 42 / 0.06);
    }

    /* Drains; freezes while hovered */
    .toast__progress {
      position: absolute;
      left: 0;
      bottom: 0;
      height: 3px;
      width: 100%;
      transform-origin: left;
      animation: toast-drain linear forwards;
      animation-duration: var(--toast-duration);
    }

    .toast:hover .toast__progress {
      animation-play-state: paused;
    }

    .toast--leaving .toast__progress {
      opacity: 0;
    }

    .toast--success {
      border-left: 5px solid #16a34a;
    }
    .toast--success .toast__icon {
      background: #16a34a;
    }
    .toast--success .toast__progress {
      background: #16a34a;
    }

    .toast--error {
      border-left: 5px solid #dc2626;
    }
    .toast--error .toast__icon {
      background: #dc2626;
    }
    .toast--error .toast__progress {
      background: #dc2626;
    }

    .toast--warn {
      border-left: 5px solid #d97706;
    }
    .toast--warn .toast__icon {
      background: #d97706;
    }
    .toast--warn .toast__progress {
      background: #d97706;
    }

    .toast--info {
      border-left: 5px solid #2563eb;
    }
    .toast--info .toast__icon {
      background: #2563eb;
    }
    .toast--info .toast__progress {
      background: #2563eb;
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translate3d(120%, 0, 0) scale(0.94);
      }
      to {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
      }
    }

    @keyframes toast-out {
      from {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
        max-height: 200px;
      }
      to {
        opacity: 0;
        transform: translate3d(120%, 0, 0) scale(0.96);
        max-height: 0;
      }
    }

    @keyframes toast-pop {
      from {
        transform: scale(0);
      }
      60% {
        transform: scale(1.18);
      }
      to {
        transform: scale(1);
      }
    }

    @keyframes toast-drain {
      from {
        transform: scaleX(1);
      }
      to {
        transform: scaleX(0);
      }
    }

    /* Reduced motion: plain fade */
    @media (prefers-reduced-motion: reduce) {
      .toast,
      .toast--leaving,
      .toast__icon {
        animation-duration: 0.01ms;
      }

      .toast__progress {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .toast-viewport {
        left: 1rem;
      }
    }
  `,
})
export class ToastContainer {
  readonly toasts = inject(ToastService);

  /** Keeps CSS, JS aligned */
  readonly durationVar = `${TOAST_AUTO_CLOSE_MS}ms`;

  icon(kind: string): string {
    if (kind === 'success') return '✓';
    if (kind === 'error') return '✕';
    if (kind === 'warn') return '!';
    return 'i';
  }
}
