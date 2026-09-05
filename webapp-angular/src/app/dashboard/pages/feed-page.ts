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
  templateUrl: './feed-page.html',
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
