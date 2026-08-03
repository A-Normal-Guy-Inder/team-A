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
  template: `
    <div class="my-requests-page">
      <!-- Heading lives in topbar -->
      <div class="request-filters" role="tablist" aria-label="Filter requests by status">
        @for (filter of FILTERS; track filter.value) {
          <button
            class="request-filter"
            role="tab"
            [class.is-active]="activeFilter() === filter.value"
            [attr.aria-selected]="activeFilter() === filter.value"
            [disabled]="isLoading()"
            (click)="setFilter(filter.value)"
          >
            {{ filter.label }}
            <span class="request-filter-count">{{ countFor(filter.value) }}</span>
          </button>
        }
      </div>

      @if (isLoading() && sent().items.length === 0) {
        <p style="padding: 20px">Loading requests...</p>
      } @else if (sent().items.length === 0) {
        <p style="padding: 20px">
          @if (activeFilter() === 'all') {
            You haven't requested any tasks yet. Go to Feed to request!
          } @else {
            No {{ activeFilter() }} requests.
          }
        </p>
      } @else {
        <div class="my-requests-grid">
          @for (request of sent().items; track request.requestId) {
            <app-sent-request-card
              [request]="request"
              [busy]="isWithdrawing(request.requestId)"
              (withdraw)="confirming.set($event)"
            />
          }
        </div>

        <app-pagination
          [meta]="sent().meta"
          [disabled]="isLoading()"
          (pageChange)="onPageChange($event)"
        />
      }

      @if (confirming(); as target) {
        <app-confirm-modal
          [message]="withdrawMessage(target)"
          confirmLabel="WITHDRAW"
          cancelLabel="KEEP"
          [busy]="isWithdrawing(target.requestId)"
          (confirmed)="handleWithdraw(target)"
          (cancelled)="confirming.set(null)"
        />
      }
    </div>
  `,
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
