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
  templateUrl: './task-card.html',
})
export class TaskCard {
  readonly task = input<Task | null>(null);
  readonly currentUserId = input<string | undefined>(undefined);
  readonly editable = input(false);

  readonly edit = output<Task>();
  readonly remove = output<Task>();
  readonly requestTask = output<Task>();

  /** Object in feed only */
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
