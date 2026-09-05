import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-modal.html',
})
export class ConfirmModal {
  readonly message = input('');
  readonly confirmLabel = input('YES');
  readonly cancelLabel = input('NO');
  readonly busy = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
