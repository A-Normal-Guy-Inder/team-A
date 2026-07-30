import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, getErrorMessage } from '../../core/api.service';
import { ApiEnvelope, User } from '../../core/api.types';
import { ToastService } from '../../core/toast/toast.service';
import { AuthStore } from '../../state/auth.store';
import { isValidPhone } from '../../shared/validation';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-update-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './update-profile.html',
})
export class UpdateProfile {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthStore);
  private readonly toasts = inject(ToastService);

  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly email = signal('');
  readonly phoneNumber = signal('');
  readonly profilePicture = signal<File | null>(null);
  readonly preview = signal('');
  readonly saving = signal(false);

  constructor() {
    // Seeds the form from the session, and re-seeds it if the user object is
    // replaced — e.g. after a successful email change writes back through patchUser.
    effect(() => {
      const user = this.auth.user();
      if (!user) return;

      this.firstName.set(user.first_name || '');
      this.lastName.set(user.last_name || '');
      this.email.set(user.email_id || '');
      this.phoneNumber.set(user.phone_number || '');
      this.profilePicture.set(null);
      this.preview.set(user.profile_picture || '');
    });
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toasts.warn('Please choose an image file');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.toasts.warn('Image is too large. Maximum size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      this.profilePicture.set(file);
      this.preview.set(String(reader.result));
    };
    reader.readAsDataURL(file);
  }

  async handleSave(): Promise<void> {
    if (!this.firstName().trim() || !this.lastName().trim()) {
      this.toasts.error('First and last name are required');
      return;
    }
    if (!isValidPhone(this.phoneNumber())) {
      this.toasts.error('Enter a valid 10-digit phone number');
      return;
    }

    try {
      this.saving.set(true);

      const formData = new FormData();
      formData.append('first_name', this.firstName().trim());
      formData.append('last_name', this.lastName().trim());
      formData.append('phone_number', this.phoneNumber().trim());

      const picture = this.profilePicture();
      if (picture) formData.append('profile_picture', picture);

      const body = await this.api.put<ApiEnvelope<{ user: User }>>('/user/profile', formData);

      if (body?.data?.user) this.auth.patchUser(body.data.user);

      this.toasts.success('Profile updated successfully ⚙️');
    } catch (error) {
      this.toasts.error(getErrorMessage(error, 'Profile update failed ❌'));
    } finally {
      this.saving.set(false);
    }
  }
}
