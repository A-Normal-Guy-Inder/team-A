import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-overlay">
      <div class="modal">
        <p style="text-align: center; margin-bottom: 20px">{{ message() }}</p>
        <div style="display: flex; justify-content: center; gap: 20px">
          <button (click)="confirmed.emit()" [disabled]="busy()">{{ confirmLabel() }}</button>
          <button (click)="cancelled.emit()" [disabled]="busy()">{{ cancelLabel() }}</button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmModal {
  readonly message = input('');
  readonly confirmLabel = input('YES');
  readonly cancelLabel = input('NO');
  readonly busy = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
