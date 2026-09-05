import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UpdateProfile } from './update-profile/update-profile';
import { ApiService, getErrorMessage } from '../core/api.service';
import { ApiEnvelope, User } from '../core/api.types';
import { ToastService } from '../core/toast/toast.service';
import { AuthStore } from '../state/auth.store';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, UpdateProfile],
  templateUrl: './settings.html',
})
export class Settings {
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthStore);
  private readonly toasts = inject(ToastService);

  readonly enabled = computed(() => Boolean(this.auth.user()?.['two_factor_enabled']));
  readonly confirming = signal(false);
  readonly password = signal('');
  readonly saving = signal(false);

  go(path: string): void {
    this.router.navigate([path]);
  }

  cancel(): void {
    this.confirming.set(false);
    this.password.set('');
  }

  async submit(): Promise<void> {
    if (this.saving()) return;

    const password = this.password();
    if (!password) {
      this.toasts.error('Please enter your password');
      return;
    }

    // Read before patchUser flips
    const next = !this.enabled();

    try {
      this.saving.set(true);
      const body = await this.api.put<ApiEnvelope<{ user: User }>>('/user/two-factor', {
        enabled: next,
        password,
      });

      if (body?.data?.user) this.auth.patchUser(body.data.user);

      this.toasts.success(
        body?.message ||
          (next ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled'),
      );
      this.cancel();
    } catch (error) {
      this.toasts.error(getErrorMessage(error, 'Could not update two-factor authentication'));
    } finally {
      this.saving.set(false);
    }
  }
}
