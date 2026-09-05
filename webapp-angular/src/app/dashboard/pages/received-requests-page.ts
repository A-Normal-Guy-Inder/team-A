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
  templateUrl: './received-requests-page.html',
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
    // Accepting also assigns task
    if (status === 'accepted') this.tasks.fetchMyTasks();
  }

  onPageChange(page: number): void {
    this.requests.fetchReceived({ page });
  }
}
