import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { NAV_PAGES } from '../../state/ui.store';

@Component({
  selector: 'app-mobile-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mobile-menu.html',
})
export class MobileMenu {
  readonly close = output<void>();
  readonly navigate = output<string>();
  readonly logoutClick = output<void>();

  readonly pages = NAV_PAGES;
}
