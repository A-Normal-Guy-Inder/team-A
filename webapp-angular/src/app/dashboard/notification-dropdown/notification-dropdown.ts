import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AppNotification } from '../../core/api.types';
import { notificationTargetPage } from '../../core/notification-routing';
import { Page } from '../../state/ui.store';
import { IconX } from '../../shared/icons';

@Component({
  selector: 'app-notification-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconX],
  templateUrl: './notification-dropdown.html',
})
export class NotificationDropdown {
  readonly notifications = input<AppNotification[]>([]);
  readonly hasUnread = input(false);
  readonly canLoadMore = input(false);

  readonly markAllRead = output<void>();
  readonly markRead = output<string>();
  readonly loadMore = output<void>();
  /** Target dashboard page */
  readonly navigate = output<Page>();

  targetPage(note: AppNotification): Page | null {
    return notificationTargetPage(note);
  }

  itemTitle(note: AppNotification): string {
    const page = this.targetPage(note);
    return page ? `Open ${page}` : '';
  }

  /* Marks read, then navigates */
  onItemClick(note: AppNotification): void {
    if (!note.read) this.markRead.emit(note._id);

    const page = this.targetPage(note);
    if (page) this.navigate.emit(page);
  }

  onDismissClick(event: Event, note: AppNotification): void {
    // Stops the row navigating
    event.stopPropagation();
    if (!note.read) this.markRead.emit(note._id);
  }

  formatTimestamp(value: string | undefined): string {
    if (!value) return '';

    const date = new Date(value);
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${date.toLocaleDateString()} • ${time}`;
  }
}
