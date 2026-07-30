import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { TaskCard } from '../cards/task-card';
import { Pagination } from '../pagination/pagination';
import { TasksStore } from '../../state/tasks.store';
import { AuthStore } from '../../state/auth.store';
import { Task } from '../../core/api.types';

@Component({
  selector: 'app-feed-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TaskCard, Pagination],
  template: `
    <div class="feed">
      @if (isEmpty()) {
        <div class="empty-state-feed">
          @if (isLoading()) {
            <h3>Loading tasks…</h3>
          } @else {
            <h3>No tasks available right now</h3>
            <p>Be the first to add a task or check back later.</p>
          }
        </div>
      } @else {
        @for (task of feed().items; track task._id) {
          <app-task-card
            [task]="task"
            [currentUserId]="currentUserId()"
            (requestTask)="requestTask.emit($event)"
          />
        }
      }
    </div>

    <app-pagination
      [meta]="feed().meta"
      [disabled]="isLoading()"
      (pageChange)="onPageChange($event)"
    />
  `,
})
export class FeedPage {
  private readonly tasks = inject(TasksStore);
  private readonly auth = inject(AuthStore);

  readonly requestTask = output<Task>();

  readonly feed = this.tasks.feed;
  readonly currentUserId = computed(() => this.auth.user()?._id);
  readonly isEmpty = computed(() => this.feed().items.length === 0);
  readonly isLoading = computed(() => this.feed().status === 'loading');

  onPageChange(page: number): void {
    this.tasks.fetchFeed({ page });
  }
}
