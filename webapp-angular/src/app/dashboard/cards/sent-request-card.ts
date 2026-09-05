import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { HelpRequest } from '../../core/api.types';

const STATUS_LABELS: Record<string, string> = {
  pending: '🟡 Pending',
  accepted: '🟢 Accepted',
  rejected: '🔴 Rejected',
  withdrawn: '⚪ Withdrawn',
};

@Component({
  selector: 'app-sent-request-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sent-request-card.html',
})
export class SentRequestCard {
  readonly request = input<HelpRequest | null>(null);
  readonly busy = input(false);

  readonly withdraw = output<HelpRequest>();

  readonly canWithdraw = computed(() => this.request()?.status === 'pending');

  readonly statusLabel = computed(() => {
    const status = this.request()?.status ?? '';
    return STATUS_LABELS[status] || status;
  });

  readonly sentDate = computed(() => {
    const value = this.request()?.creationDate;
    return value ? `Sent ${new Date(value).toLocaleDateString()}` : 'Date not available';
  });
}
