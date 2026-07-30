import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { IconEye, IconEyeOff } from '../icons';

@Component({
  selector: 'app-password-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconEye, IconEyeOff],
  template: `
    <div class="password-field">
      <input
        [type]="visible() ? 'text' : 'password'"
        [name]="name()"
        [placeholder]="placeholder()"
        [value]="value()"
        [attr.autocomplete]="autocomplete()"
        maxlength="100"
        (input)="valueChange.emit($any($event.target).value)"
        (keydown)="onKeydown($event)"
      />
      <button
        type="button"
        class="toggle-password"
        [attr.aria-label]="visible() ? 'Hide password' : 'Show password'"
        (click)="visible.set(!visible())"
      >
        @if (visible()) {
          <app-icon-eye-off [size]="18" />
        } @else {
          <app-icon-eye [size]="18" />
        }
      </button>
    </div>
  `,
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
