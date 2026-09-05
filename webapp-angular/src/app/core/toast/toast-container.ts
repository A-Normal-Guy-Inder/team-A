import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TOAST_AUTO_CLOSE_MS, ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
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
