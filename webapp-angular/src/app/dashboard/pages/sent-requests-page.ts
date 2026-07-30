import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SentRequestCard } from '../cards/sent-request-card';
import { Pagination } from '../pagination/pagination';
import { RequestsStore } from '../../state/requests.store';

@Component({
  selector: 'app-sent-requests-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SentRequestCard, Pagination],
  template: `
    <div class="my-requests-page">
      <h2>My Requests</h2>
      <p class="page-subtitle">Track the help requests you've sent</p>

      @if (isLoading() && sent().items.length === 0) {
        <p style="padding: 20px">Loading requests...</p>
      } @else if (sent().items.length === 0) {
        <p style="padding: 20px">
          You haven't requested any tasks yet. Go to Feed to request!
        </p>
      } @else {
        <div class="my-requests-grid">
          @for (request of sent().items; track request.requestId) {
            <app-sent-request-card [request]="request" />
          }
        </div>

        <app-pagination
          [meta]="sent().meta"
          [disabled]="isLoading()"
          (pageChange)="onPageChange($event)"
        />
      }
    </div>
  `,
})
export class SentRequestsPage {
  private readonly requests = inject(RequestsStore);

  readonly sent = this.requests.sent;
  readonly isLoading = computed(() => this.sent().status === 'loading');

  onPageChange(page: number): void {
    this.requests.fetchSent({ page });
  }
}
