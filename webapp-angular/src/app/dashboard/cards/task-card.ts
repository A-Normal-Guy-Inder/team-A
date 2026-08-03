import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Task, TaskAuthor } from '../../core/api.types';

interface RequestButton {
  text: string;
  disabled: boolean;
  className: string;
}

const UNAVAILABLE_STATUSES = ['completed', 'cancelled', 'assigned', 'closed'];

@Component({
  selector: 'app-task-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (task(); as t) {
      <div class="task-card">
        <div class="task-image-wrapper">
          @if (t.picture) {
            <img [src]="t.picture" alt="task" class="task-image" loading="lazy" />
          } @else {
            <div class="task-image-placeholder"><span>📷 No image provided</span></div>
          }
        </div>

        <div class="badges-container">
          <div class="tag">{{ t.category || 'General' }}</div>
          @if (editable() && t.status) {
            <div class="status-badge status-{{ t.status.toLowerCase() }}">{{ t.status }}</div>
          }
        </div>

        <div class="card-content">
          <h3>{{ t.title }}</h3>
          <p class="task-description">{{ t.description?.trim() || 'No description provided' }}</p>

          @if (t.location) {
            <p class="task-location"><span class="icon">📍</span> {{ t.location }}</p>
          }

          @if (t.start_time) {
            <p class="task-date">
              <span class="icon">🟢</span> Start: {{ formatDate(t.start_time) }} •
              {{ formatTime(t.start_time) }}
            </p>
          }

          @if (t.end_time) {
            <p class="task-date end-date">
              <span class="icon">🔴</span> End: {{ formatDate(t.end_time) }} •
              {{ formatTime(t.end_time) }}
            </p>
          }

          <div class="task-footer">
            <div class="task-author">
              <div class="author-avatar">
                @if (authorPicture()) {
                  <img
                    [src]="authorPicture()"
                    [alt]="author()?.first_name || 'User'"
                    class="author-avatar-image"
                    loading="lazy"
                  />
                } @else {
                  {{ authorInitial() }}
                }
              </div>
              <!--
                One span, not one per name part: as two spans in a column flex
                the surname dropped onto its own line, and each was clipped
                independently. The full name now wraps as a single phrase.
              -->
              <div class="author-name" [title]="authorName()">
                <span>{{ authorName() }}</span>
              </div>
            </div>

            @if (editable()) {
              <div class="owner-actions">
                <button class="edit-btn" (click)="edit.emit(t)">✏️ Edit</button>
                <button class="delete-btn" (click)="remove.emit(t)">🗑️ Delete</button>
              </div>
            } @else {
              <button
                [class]="button().className"
                (click)="onRequestClick(t)"
                [disabled]="button().disabled"
              >
                {{ button().text }}
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class TaskCard {
  readonly task = input<Task | null>(null);
  readonly currentUserId = input<string | undefined>(undefined);
  readonly editable = input(false);

  readonly edit = output<Task>();
  readonly remove = output<Task>();
  readonly requestTask = output<Task>();

  /** The feed populates user_id; My Tasks returns it as a bare id. */
  readonly author = computed<TaskAuthor | null>(() => {
    const value = this.task()?.user_id;
    return typeof value === 'object' && value !== null ? value : null;
  });

  readonly authorPicture = computed(
    () => this.author()?.profile_picture || this.author()?.picture || '',
  );

  readonly authorInitial = computed(() =>
    (this.author()?.first_name || 'U').charAt(0).toUpperCase(),
  );

  readonly authorName = computed(() => {
    const author = this.author();
    return `${author?.first_name || ''} ${author?.last_name || ''}`.trim() || 'User';
  });

  readonly button = computed<RequestButton>(() => {
    const task = this.task();
    const authorId = this.author()?._id ?? task?.user_id;
    const currentUserId = this.currentUserId();

    const isOwnTask = Boolean(currentUserId) && String(currentUserId) === String(authorId);
    if (isOwnTask) return { text: 'Your Task', disabled: true, className: 'request-btn disabled' };

    if (task?.hasRequested) {
      return { text: 'Requested', disabled: true, className: 'request-btn requested' };
    }
    if (UNAVAILABLE_STATUSES.includes(task?.status ?? '')) {
      return { text: 'Unavailable', disabled: true, className: 'request-btn unavailable' };
    }

    return { text: 'Request Task', disabled: false, className: 'request-btn' };
  });

  onRequestClick(task: Task): void {
    if (!this.button().disabled) this.requestTask.emit(task);
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleDateString();
  }

  formatTime(value: string): string {
    return new Date(value).toLocaleTimeString();
  }
}
