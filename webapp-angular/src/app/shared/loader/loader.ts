import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="loader-overlay" role="status" aria-live="polite" aria-label="Loading">
      <!--
        Six dots on a ring; the stagger and the brand fills are in loader.css.
        The <circle> order here is the order the wave travels in, so the
        :nth-of-type rules in the stylesheet depend on it.
      -->
      <div class="loader">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" aria-hidden="true">
          <circle cx="50" cy="37" r="7" />
          <circle cx="62.5" cy="43.5" r="7" />
          <circle cx="62.5" cy="56.5" r="7" />
          <circle cx="50" cy="65" r="7" />
          <circle cx="37.5" cy="56.5" r="7" />
          <circle cx="37.5" cy="43.5" r="7" />
        </svg>
      </div>
    </div>
  `,
})
export class Loader {}
