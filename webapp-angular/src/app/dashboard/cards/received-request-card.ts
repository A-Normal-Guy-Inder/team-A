import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { HelpRequest } from '../../core/api.types';

@Component({
  selector: 'app-received-request-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (request(); as r) {
      <div class="request-card">
        <div class="requester-header">
          <div class="requester-avatar">
            @if (avatar()) {
              <img
                [src]="avatar()"
                [alt]="r.requester?.first_name || 'User'"
                class="requester-avatar-image"
                loading="lazy"
              />
            } @else {
              {{ initial() }}
            }
          </div>
          <div class="requester-info">
            <h3>{{ r.requester?.name || 'User' }}</h3>
          </div>
        </div>

        <div class="request-task-info">
          <h4>Requesting for: {{ r.taskTitle || 'Task' }}</h4>
          @if (r.taskPicture) {
            <img
              [src]="r.taskPicture"
              [alt]="r.taskTitle"
              class="request-task-image"
              loading="lazy"
            />
          }
        </div>

        <div class="request-message">
          <p><strong>Their message:</strong></p>
          <p class="message-text">{{ r.description || 'No message' }}</p>
        </div>

        <div class="request-meta">
          <span>📍 {{ r.taskLocation || 'Location not specified' }}</span>
          <span>🕐 {{ creationDate() }}</span>
        </div>

        <div class="request-actions">
          @if (r.status === 'pending') {
            <button class="btn-accept" (click)="accept.emit(r.requestId)" [disabled]="isBusy()">
              {{ pendingAction() === 'accepted' ? '...' : '✓ Accept' }}
            </button>
            <button class="btn-reject" (click)="reject.emit(r.requestId)" [disabled]="isBusy()">
              {{ pendingAction() === 'rejected' ? '...' : ' ✕ Reject' }}
            </button>
          } @else {
            <span class="status-badge status-{{ r.status }}">{{ statusLabel() }}</span>
          }
        </div>
      </div>
    }
  `,
})
export class ReceivedRequestCard {
  readonly request = input<HelpRequest | null>(null);
  readonly pendingAction = input<string | undefined>(undefined);

  readonly accept = output<string>();
  readonly reject = output<string>();

  readonly isBusy = computed(() => Boolean(this.pendingAction()));

  readonly avatar = computed(
    () => this.request()?.requester?.profilePicture || this.request()?.requester?.picture || '',
  );

  readonly initial = computed(() =>
    (this.request()?.requester?.first_name || 'U').charAt(0).toUpperCase(),
  );

  readonly creationDate = computed(() => {
    const value = this.request()?.creationDate;
    return value ? new Date(value).toLocaleDateString() : '';
  });

  readonly statusLabel = computed(() => {
    const status = this.request()?.status ?? '';
    return status.charAt(0).toUpperCase() + status.slice(1);
  });
}
