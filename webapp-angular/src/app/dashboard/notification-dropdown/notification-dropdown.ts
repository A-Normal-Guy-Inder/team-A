import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AppNotification } from '../../core/api.types';

@Component({
  selector: 'app-notification-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="notification-dropdown">
      <div class="notification-header">
        <span>Notifications</span>
        @if (hasUnread()) {
          <p class="mark-all-btn" (click)="markAllRead.emit()">Mark all as read</p>
        }
      </div>

      <div class="notification-list">
        @if (notifications().length === 0) {
          <div class="notification-empty"><p>No notifications yet</p></div>
        } @else {
          @for (note of notifications(); track note._id) {
            <div
              class="notification-item"
              [class.read]="note.read"
              [class.unread]="!note.read"
              (click)="onItemClick(note)"
            >
              <div class="notification-dot"></div>
              <div class="notification-content">
                <p class="notification-message">{{ note.message }}</p>
                <p class="notification-time">{{ formatTimestamp(note.createdAt) }}</p>
              </div>
            </div>
          }

          @if (canLoadMore()) {
            <div class="notification-item notification-load-more" (click)="loadMore.emit()">
              <div class="notification-content">
                <p class="notification-message">Load older notifications</p>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class NotificationDropdown {
  readonly notifications = input<AppNotification[]>([]);
  readonly hasUnread = input(false);
  readonly canLoadMore = input(false);

  readonly markAllRead = output<void>();
  readonly markRead = output<string>();
  readonly loadMore = output<void>();

  onItemClick(note: AppNotification): void {
    if (!note.read) this.markRead.emit(note._id);
  }

  formatTimestamp(value: string | undefined): string {
    if (!value) return '';

    const date = new Date(value);
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${date.toLocaleDateString()} • ${time}`;
  }
}
