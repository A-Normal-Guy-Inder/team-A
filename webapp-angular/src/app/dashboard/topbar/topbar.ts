import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { IconBell } from '../../shared/icons';
import { NotificationDropdown } from '../notification-dropdown/notification-dropdown';
import { AppNotification } from '../../core/api.types';

const NO_SEARCH_PAGES = ['Settings', 'Add Task'];

@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconBell, NotificationDropdown],
  template: `
    <div class="topbar">
      <div class="topbar-left">
        <span class="hamburger-icon" (click)="openMenu.emit()">☰</span>
        <h2>{{ activePage() }}</h2>
      </div>

      <div class="topbar-center">
        @if (showSearch()) {
          <input
            type="text"
            [placeholder]="searchPlaceholder()"
            [value]="searchTerm()"
            (input)="searchChange.emit($any($event.target).value)"
          />
        }
      </div>

      <div class="topbar-right">
        <div #bell class="notification-bell" (click)="toggleNotifications.emit()">
          <app-icon-bell [size]="25" />
          @if (unreadCount() > 0) {
            <span class="notification-badge">{{ unreadCount() }}</span>
          }
        </div>

        @if (showNotifications()) {
          <app-notification-dropdown
            #dropdown
            [notifications]="notifications()"
            [hasUnread]="unreadCount() > 0"
            [canLoadMore]="canLoadMoreNotifications()"
            (markAllRead)="markAllRead.emit()"
            (markRead)="markRead.emit($event)"
            (loadMore)="loadMoreNotifications.emit()"
          />
        }
      </div>
    </div>
  `,
})
export class Topbar {
  readonly activePage = input('Feed');
  readonly searchTerm = input('');
  readonly showNotifications = input(false);
  readonly notifications = input<AppNotification[]>([]);
  readonly unreadCount = input(0);
  readonly canLoadMoreNotifications = input(false);

  readonly searchChange = output<string>();
  readonly openMenu = output<void>();
  readonly toggleNotifications = output<void>();
  readonly closeNotifications = output<void>();
  readonly markAllRead = output<void>();
  readonly markRead = output<string>();
  readonly loadMoreNotifications = output<void>();

  private readonly bell = viewChild<ElementRef<HTMLElement>>('bell');
  private readonly dropdown = viewChild('dropdown', { read: ElementRef<HTMLElement> });

  readonly showSearch = computed(() => !NO_SEARCH_PAGES.includes(this.activePage()));
  readonly searchPlaceholder = computed(() => `Search in ${this.activePage().toLowerCase()}...`);

  constructor() {
    /*
     * Dismiss the dropdown on any press outside it. The bell is excluded too —
     * its own click already toggles, so closing here as well would fire twice
     * and reopen it. Listening on `pointerdown` covers mouse, touch and pen in
     * one pass; it is registered only while the panel is open, and it lands
     * after this render commits, so the press that opened the panel is long
     * finished and cannot close it again.
     */
    let detach: (() => void) | null = null;

    const removeListener = () => {
      detach?.();
      detach = null;
    };

    effect(() => {
      removeListener();
      if (!this.showNotifications()) return;

      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as Node;
        if (this.bell()?.nativeElement.contains(target)) return;
        if (this.dropdown()?.nativeElement.contains(target)) return;
        this.closeNotifications.emit();
      };

      document.addEventListener('pointerdown', handlePointerDown);
      detach = () => document.removeEventListener('pointerdown', handlePointerDown);
    });

    inject(DestroyRef).onDestroy(removeListener);
  }
}
