import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SentRequestCard } from '../cards/sent-request-card';
import { Pagination } from '../pagination/pagination';
import { ConfirmModal } from '../modals/confirm-modal';
import { RequestsStore } from '../../state/requests.store';
import { ToastService } from '../../core/toast/toast.service';
import { HelpRequest } from '../../core/api.types';

/* Withdrawn needs a tab */
const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
] as const;

@Component({
  selector: 'app-sent-requests-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SentRequestCard, Pagination, ConfirmModal],
  templateUrl: './sent-requests-page.html',
})
export class SentRequestsPage {
  private readonly requests = inject(RequestsStore);
  private readonly toasts = inject(ToastService);

  readonly FILTERS = STATUS_FILTERS;

  readonly sent = this.requests.sent;
  readonly isLoading = computed(() => this.sent().status === 'loading');
  readonly confirming = signal<HelpRequest | null>(null);

  /** Empty status means "all" */
  readonly activeFilter = computed(() => this.sent().query.status || 'all');

  /* Counts span all tabs */
  countFor(value: string): number {
    return this.sent().meta.statusCounts?.[value] ?? 0;
  }

  setFilter(value: string): void {
    if (this.activeFilter() === value) return;

    // Empty status, reset page
    this.requests.fetchSent({ status: value === 'all' ? '' : value, page: 1 });
  }

  isWithdrawing(requestId: string): boolean {
    return this.requests.actionInFlight()[requestId] === 'withdrawn';
  }

  withdrawMessage(request: HelpRequest): string {
    return `Withdraw your application for "${request.taskTitle}"? The task owner will be notified.`;
  }

  async handleWithdraw(request: HelpRequest): Promise<void> {
    const result = await this.requests.withdraw(request.requestId);

    this.confirming.set(null);

    if (!result.ok) {
      this.toasts.error(result.error);
      return;
    }

    this.toasts.success('Application withdrawn');
  }

  onPageChange(page: number): void {
    this.requests.fetchSent({ page });
  }
}
