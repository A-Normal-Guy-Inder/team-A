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
  template: `
    <div class="modal-overlay">
      <div class="modal request-modal">
        <h2>Send Request</h2>

        <div class="modal-task-info">
          <h3>{{ task().title }}</h3>
          @if (task().picture) {
            <img [src]="task().picture" [alt]="task().title" class="modal-task-image" />
          }
        </div>

        <label for="send-request-message">Your Message to the Task Owner</label>
        <textarea
          id="send-request-message"
          name="description"
          placeholder="Tell the task owner about your experience, availability, and why you'd be great for this task..."
          maxlength="1000"
          rows="6"
          style="width: 100%; padding: 10px; margin-bottom: 15px"
          [ngModel]="message()"
          (ngModelChange)="message.set($event)"
        ></textarea>

        <div class="modal-actions">
          <button class="btn-submit" (click)="handleSubmit()" [disabled]="submitDisabled()">
            {{ sending() ? 'Sending...' : 'Send Request' }}
          </button>
          <button class="btn-cancel" (click)="closed.emit()">Cancel</button>
        </div>
      </div>
    </div>
  `,
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
      // "You have already requested this task" is not something retrying fixes,
      // so that one closes the modal instead of leaving it open.
      if (result.error.toLowerCase().includes('already')) this.closed.emit();
      return;
    }

    this.tasks.markTaskRequested(this.task()._id);
    this.requests.fetchSent({ page: 1 });
    this.toasts.success('Task request sent successfully 📩');
    this.closed.emit();
  }
}
