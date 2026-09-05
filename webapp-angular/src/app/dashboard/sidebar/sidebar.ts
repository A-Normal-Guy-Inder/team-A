import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NAV_PAGES } from '../../state/ui.store';
import { User } from '../../core/api.types';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.html',
})
export class Sidebar {
  readonly activePage = input<string>('Feed');
  readonly user = input<User | null>(null);
  readonly pendingCount = input(0);

  readonly navigate = output<string>();
  readonly logoutClick = output<void>();

  readonly pages = NAV_PAGES;

  /* Field renaming lives here */
  readonly picture = computed(() => this.user()?.profile_picture ?? '');

  readonly email = computed(() => this.user()?.email_id || 'user@email.com');

  readonly initial = computed(() => {
    const user = this.user();
    return (user?.first_name || user?.email_id || 'U').charAt(0).toUpperCase();
  });

  readonly fullName = computed(() => {
    const user = this.user();
    return `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User';
  });
}
