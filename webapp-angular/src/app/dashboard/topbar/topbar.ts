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
import { PAGE_SUBTITLES, Page } from '../../state/ui.store';

const NO_SEARCH_PAGES = ['Settings', 'Add Task'];

@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconBell, NotificationDropdown],
  templateUrl: './topbar.html',
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
  /** Carries the target page */
  readonly notificationNavigate = output<Page>();

  private readonly bell = viewChild<ElementRef<HTMLElement>>('bell');
  private readonly dropdown = viewChild('dropdown', { read: ElementRef<HTMLElement> });

  readonly subtitle = computed(() => PAGE_SUBTITLES[this.activePage() as Page] ?? '');

  readonly showSearch = computed(() => !NO_SEARCH_PAGES.includes(this.activePage()));
  readonly searchPlaceholder = computed(() => `Search in ${this.activePage().toLowerCase()}...`);

  constructor() {
    /* Outside press closes dropdown */
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
