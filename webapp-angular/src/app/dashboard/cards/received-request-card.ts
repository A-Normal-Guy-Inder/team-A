import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { HelpRequest } from '../../core/api.types';

@Component({
  selector: 'app-received-request-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './received-request-card.html',
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
