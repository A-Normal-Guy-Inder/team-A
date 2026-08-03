import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageUploadField, ImageSelection } from '../image-upload-field/image-upload-field';
import { CATEGORIES } from '../../shared/categories';
import { TasksStore } from '../../state/tasks.store';
import { UiStore } from '../../state/ui.store';
import { ToastService } from '../../core/toast/toast.service';
import { validateTaskForm } from '../../shared/validation';
import { nowForInput } from '../../shared/datetime';

@Component({
  selector: 'app-add-task-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ImageUploadField],
  templateUrl: './add-task-page.html',
})
export class AddTaskPage {
  private readonly tasks = inject(TasksStore);
  private readonly ui = inject(UiStore);
  private readonly toasts = inject(ToastService);

  readonly categories = CATEGORIES;
  readonly saving = this.tasks.saving;

  readonly title = signal('');
  readonly description = signal('');
  readonly category = signal('');
  readonly location = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly image = signal<File | null>(null);
  readonly imagePreview = signal<string | null>(null);

  /** End follows chosen start */
  readonly minEndDate = computed(() => this.startDate() || nowForInput());

  minStartDate(): string {
    return nowForInput();
  }

  onImageSelect(selection: ImageSelection): void {
    this.image.set(selection.file);
    this.imagePreview.set(selection.preview);
  }

  onImageRemove(): void {
    this.image.set(null);
    this.imagePreview.set(null);
  }

  /** Clears fields, then leaves */
  handleCancel(): void {
    if (this.saving()) return;

    this.resetForm();
    this.leave();
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
      'create',
    );

    if (error) {
      this.toasts.error(error);
      return;
    }

    const formData = new FormData();
    formData.append('title', this.title().trim());
    formData.append('description', this.description().trim());
    formData.append('category', this.category());
    formData.append('location', this.location().trim());
    formData.append('start_time', this.startDate());
    formData.append('end_time', this.endDate());

    const image = this.image();
    if (image) formData.append('picture', image);

    const result = await this.tasks.createTask(formData);

    if (!result.ok) {
      this.toasts.error(result.error);
      return;
    }

    this.resetForm();
    this.toasts.success('Task added successfully ✅');
    this.leave();
    this.tasks.fetchMyTasks({ page: 1 });
  }

  /** Replaces entry, not pushes */
  private leave(): void {
    this.ui.setActivePage('My Tasks', { replaceUrl: true });
  }

  private resetForm(): void {
    this.title.set('');
    this.description.set('');
    this.category.set('');
    this.location.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.image.set(null);
    this.imagePreview.set(null);
  }
}
