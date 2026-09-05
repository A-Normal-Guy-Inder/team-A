import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { IconEye, IconEyeOff } from '../icons';

@Component({
  selector: 'app-password-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconEye, IconEyeOff],
  templateUrl: './password-input.html',
})
export class PasswordInput {
  readonly name = input('');
  readonly placeholder = input('');
  readonly value = input('');
  readonly autocomplete = input('off');

  readonly valueChange = output<string>();
  readonly enter = output<void>();

  readonly visible = signal(false);

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.enter.emit();
  }
}
