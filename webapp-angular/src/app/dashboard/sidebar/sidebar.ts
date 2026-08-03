import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NAV_PAGES } from '../../state/ui.store';
import { User } from '../../core/api.types';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <h3 class="logo">Hire-a-Helper</h3>
      </div>

      <ul class="sidebar-menu">
        @for (page of pages; track page) {
          <li [class.active]="activePage() === page" (click)="navigate.emit(page)">
            {{ page }}
            @if (page === 'Requests' && pendingCount() > 0) {
              <span class="pending-badge">{{ pendingCount() }}</span>
            }
          </li>
        }
      </ul>

      <div class="sidebar-footer">
        <div class="sidebar-footer-info">
          <div class="sidebar-footer-user">
            @if (picture()) {
              <img [src]="picture()" alt="profile" class="sidebar-footer-avatar" />
            } @else {
              {{ initial() }}
            }
          </div>
          <div class="sidebar-footer-text">
            <strong>{{ fullName() }}</strong>
            <span>{{ email() }}</span>
          </div>
        </div>
        <button class="logout-btn" (click)="logoutClick.emit()">Logout</button>
      </div>
    </aside>
  `,
})
export class Sidebar {
  readonly activePage = input<string>('Feed');
  readonly user = input<User | null>(null);
  readonly pendingCount = input(0);

  readonly navigate = output<string>();
  readonly logoutClick = output<void>();

  readonly pages = NAV_PAGES;

  /*
   * Dashboard used to reshape the user before handing it down
   * (`{...user, email: user.email_id, picture: user.profile_picture}`). The
   * renaming belongs to the view, so it happens here and the parent passes the
   * user through untouched.
   */
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
