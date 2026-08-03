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
  template: `
    @if (request(); as r) {
      <div class="request-card my-request-card">
        <div class="request-task-image-wrapper">
          @if (r.taskPicture) {
            <img
              [src]="r.taskPicture"
              [alt]="r.taskTitle || 'Task'"
              class="request-task-image"
              loading="lazy"
            />
          } @else {
            <div class="request-task-image-placeholder">📷 No image provided</div>
          }
        </div>

        <div class="request-card-body">
          <h3 class="request-title">{{ r.taskTitle || 'Untitled task' }}</h3>
          <p class="request-owner">
            <strong>Owner:</strong> {{ r.taskOwnerName || 'Not available' }}
          </p>
          @if (r.taskLocation) {
            <p class="task-location">📍 {{ r.taskLocation }}</p>
          }
          <div class="request-message">
            <strong>Your message:</strong>
            <p>{{ r.description || 'No message' }}</p>
          </div>
        </div>

        <div class="request-status-section">
          <span class="status-badge status-{{ r.status }}">{{ statusLabel() }}</span>
          <p class="request-date">{{ sentDate() }}</p>

          <!-- Only pending can retract -->
          @if (canWithdraw()) {
            <button class="withdraw-btn" (click)="withdraw.emit(r)" [disabled]="busy()">
              {{ busy() ? 'Withdrawing…' : 'Withdraw' }}
            </button>
          }
        </div>
      </div>
    }
  `,
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
