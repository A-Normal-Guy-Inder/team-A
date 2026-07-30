import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="loader-overlay">
      <div class="loader"></div>
    </div>
  `,
})
export class Loader {}
