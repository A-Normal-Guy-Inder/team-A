import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AppNotification } from '../../core/api.types';
import { notificationTargetPage } from '../../core/notification-routing';
import { Page } from '../../state/ui.store';
import { IconX } from '../../shared/icons';

@Component({
  selector: 'app-notification-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconX],
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
              [class.notification-linked]="targetPage(note) !== null"
              [attr.role]="targetPage(note) ? 'button' : null"
              [attr.tabindex]="targetPage(note) ? 0 : null"
              [title]="itemTitle(note)"
              (click)="onItemClick(note)"
              (keydown.enter)="onItemClick(note)"
            >
              <div class="notification-dot"></div>
              <div class="notification-content">
                <p class="notification-message">{{ note.message }}</p>
                <p class="notification-time">{{ formatTimestamp(note.createdAt) }}</p>
              </div>

              <!-- Unread rows only -->
              @if (!note.read) {
                <button
                  type="button"
                  class="notification-dismiss"
                  title="Mark as read without leaving this page"
                  aria-label="Mark as read without leaving this page"
                  (click)="onDismissClick($event, note)"
                >
                  <app-icon-x [size]="14" />
                </button>
              }
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
