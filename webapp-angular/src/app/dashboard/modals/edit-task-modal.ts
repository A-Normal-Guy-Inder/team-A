import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CATEGORIES } from '../../shared/categories';
import { TasksStore } from '../../state/tasks.store';
import { ToastService } from '../../core/toast/toast.service';
import { validateTaskForm } from '../../shared/validation';
import { toDateTimeLocal } from '../../shared/datetime';
import { Task } from '../../core/api.types';

@Component({
  selector: 'app-edit-task-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './edit-task-modal.html',
})
export class EditTaskModal {
  private readonly tasks = inject(TasksStore);
  private readonly toasts = inject(ToastService);

  readonly task = input.required<Task>();
  readonly closed = output<void>();

  readonly categories = CATEGORIES;
  readonly saving = this.tasks.saving;

  readonly title = signal('');
  readonly category = signal('');
  readonly description = signal('');
  readonly location = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly newImage = signal<File | null>(null);

  constructor() {
    // Refills fields per task
    effect(() => {
      const task = this.task();

      this.title.set(task.title || '');
      this.category.set(task.category || '');
      this.description.set(task.description || '');
      this.location.set(task.location || '');
      this.startDate.set(toDateTimeLocal(task.start_time));
      this.endDate.set(toDateTimeLocal(task.end_time));
      this.newImage.set(null);
    });
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newImage.set(input.files?.[0] ?? null);
  }

  async handleSubmit(): Promise<void> {
    const error = validateTaskForm(
      {
        title: this.title(),
        category: this.category(),
        location: this.location(),
        startDate: this.startDate(),
        endDate: this.endDate(),
      },
      'edit',
    );

    if (error) {
      this.toasts.error(error);
      return;
    }

    const formData = new FormData();
    formData.append('title', this.title().trim());
    formData.append('category', this.category());
    formData.append('description', this.description().trim());
    formData.append('location', this.location().trim());
    formData.append('start_time', this.startDate());
    formData.append('end_time', this.endDate());

    const image = this.newImage();
    if (image) formData.append('picture', image);

    const result = await this.tasks.updateTask(this.task()._id, formData);

    if (!result.ok) {
      this.toasts.error(result.error);
      return;
    }

    this.toasts.success('Task updated successfully ✏️');
    this.closed.emit();
    this.tasks.fetchMyTasks();
    this.tasks.fetchFeed();
  }
}
