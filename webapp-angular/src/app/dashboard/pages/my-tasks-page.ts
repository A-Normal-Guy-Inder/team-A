import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { TaskCard } from '../cards/task-card';
import { Pagination } from '../pagination/pagination';
import { TasksStore } from '../../state/tasks.store';
import { Task } from '../../core/api.types';

@Component({
  selector: 'app-my-tasks-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TaskCard, Pagination],
  templateUrl: './my-tasks-page.html',
})
export class MyTasksPage {
  private readonly tasks = inject(TasksStore);

  readonly addTask = output<void>();
  readonly editTask = output<Task>();
  readonly deleteTask = output<Task>();

  readonly myTasks = this.tasks.myTasks;
  readonly isEmpty = computed(() => this.myTasks().items.length === 0);
  readonly isLoading = computed(() => this.myTasks().status === 'loading');

  onPageChange(page: number): void {
    this.tasks.fetchMyTasks({ page });
  }
}
