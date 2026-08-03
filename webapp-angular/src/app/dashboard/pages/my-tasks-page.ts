import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { TaskCard } from '../cards/task-card';
import { Pagination } from '../pagination/pagination';
import { TasksStore } from '../../state/tasks.store';
import { Task } from '../../core/api.types';

@Component({
  selector: 'app-my-tasks-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TaskCard, Pagination],
  template: `
    <div class="my-tasks-header">
      <button class="add-task-btn" (click)="addTask.emit()">+ Add New Task</button>
    </div>

    <div class="feed my-tasks-section">
      @if (isEmpty()) {
        <div class="empty-state">
          @if (isLoading()) {
            <h3>Loading your tasks…</h3>
          } @else {
            <h3>You haven’t created any tasks yet</h3>
            <p>Start by adding a new task and get help from others.</p>
          }
        </div>
      } @else {
        @for (task of myTasks().items; track task._id) {
          <app-task-card
            [task]="task"
            [editable]="true"
            (edit)="editTask.emit($event)"
            (remove)="deleteTask.emit($event)"
          />
        }
      }
    </div>

    <app-pagination
      [meta]="myTasks().meta"
      [disabled]="isLoading()"
      (pageChange)="onPageChange($event)"
    />
  `,
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
