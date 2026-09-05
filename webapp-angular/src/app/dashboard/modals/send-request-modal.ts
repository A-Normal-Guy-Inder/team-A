import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RequestsStore } from '../../state/requests.store';
import { TasksStore } from '../../state/tasks.store';
import { ToastService } from '../../core/toast/toast.service';
import { Task } from '../../core/api.types';

@Component({
  selector: 'app-send-request-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './send-request-modal.html',
})
export class SendRequestModal {
  private readonly requests = inject(RequestsStore);
  private readonly tasks = inject(TasksStore);
  private readonly toasts = inject(ToastService);

  readonly task = input.required<Task>();
  readonly closed = output<void>();

  readonly message = signal('');
  readonly sending = this.requests.sending;
  readonly submitDisabled = computed(() => this.sending() || !this.message().trim());

  async handleSubmit(): Promise<void> {
    const description = this.message().trim();
    if (!description) return;

    const result = await this.requests.sendRequest(this.task()._id, description);

    if (!result.ok) {
      this.toasts.error(result.error);
      // Not retryable; close modal
      if (result.error.toLowerCase().includes('already')) this.closed.emit();
      return;
    }

    this.tasks.markTaskRequested(this.task()._id);
    this.requests.fetchSent({ page: 1 });
    this.toasts.success('Task request sent successfully 📩');
    this.closed.emit();
  }
}
