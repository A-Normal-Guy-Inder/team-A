import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { PAGES } from '../../state/ui.store';

@Component({
  selector: 'app-mobile-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hamburger-overlay" (click)="close.emit()">
      <!-- Clicks inside the drawer must not reach the backdrop that closes it. -->
      <div class="hamburger-menu" (click)="$event.stopPropagation()">
        <h3>Hire-a-Helper</h3>
        <ul class="menu-list">
          @for (page of pages; track page) {
            <li (click)="navigate.emit(page)" style="cursor: pointer">{{ page }}</li>
          }
        </ul>
        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logoutClick.emit()">Logout</button>
        </div>
      </div>
    </div>
  `,
})
export class MobileMenu {
  readonly close = output<void>();
  readonly navigate = output<string>();
  readonly logoutClick = output<void>();

  readonly pages = PAGES;
}
