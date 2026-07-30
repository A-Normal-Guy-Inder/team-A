import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReceivedRequestCard } from '../cards/received-request-card';
import { Pagination } from '../pagination/pagination';
import { RequestsStore } from '../../state/requests.store';
import { TasksStore } from '../../state/tasks.store';
import { ToastService } from '../../core/toast/toast.service';

@Component({
  selector: 'app-received-requests-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReceivedRequestCard, Pagination],
  template: `
    <div class="requests-page">
      <h2>Incoming Requests</h2>
      <p class="page-subtitle">People who want to help with your tasks</p>

      @if (isLoading() && received().items.length === 0) {
        <p style="padding: 20px">Loading requests...</p>
      } @else if (received().items.length === 0) {
        <p style="padding: 20px">No requests yet. Create a task to get started!</p>
      } @else {
        <div class="feed">
          @for (request of received().items; track request.requestId) {
            <app-received-request-card
              [request]="request"
              [pendingAction]="actionInFlight()[request.requestId]"
              (accept)="respond($event, 'accepted')"
              (reject)="respond($event, 'rejected')"
            />
          }
        </div>

        <app-pagination
          [meta]="received().meta"
          [disabled]="isLoading()"
          (pageChange)="onPageChange($event)"
        />
      }
    </div>
  `,
})
export class ReceivedRequestsPage {
  private readonly requests = inject(RequestsStore);
  private readonly tasks = inject(TasksStore);
  private readonly toasts = inject(ToastService);

  readonly received = this.requests.received;
  readonly actionInFlight = this.requests.actionInFlight;
  readonly isLoading = computed(() => this.received().status === 'loading');

  async respond(requestId: string, status: string): Promise<void> {
    if (!requestId) return;

    const result = await this.requests.respond(requestId, status);

    if (!result.ok) {
      this.toasts.error(result.error);
      return;
    }

    this.toasts.success(status === 'accepted' ? 'Request accepted! ✅' : 'Request rejected');

    this.requests.fetchReceived();
    // Accepting assigns the task, so the owner's own list is now stale too.
    if (status === 'accepted') this.tasks.fetchMyTasks();
  }

  onPageChange(page: number): void {
    this.requests.fetchReceived({ page });
  }
}
