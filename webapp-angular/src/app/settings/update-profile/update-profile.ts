import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, getErrorMessage } from '../../core/api.service';
import { ApiEnvelope, User } from '../../core/api.types';
import { ToastService } from '../../core/toast/toast.service';
import { AuthStore } from '../../state/auth.store';
import { isValidPhone } from '../../shared/validation';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Matches the schema cap */
const BIO_MAX_LENGTH = 500;

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
  readonly phoneNumber = signal('');
  readonly bio = signal('');
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly removing = signal(false);

  readonly BIO_MAX = BIO_MAX_LENGTH;

  /* Follow session, not form */
  readonly preview = computed(() => this.auth.user()?.profile_picture || '');
  readonly email = computed(() => this.auth.user()?.email_id || '');

  /** Only when picture exists */
  readonly canRemovePicture = computed(() => Boolean(this.auth.user()?.profile_picture));

  /** Either button mid-flight */
  readonly pictureBusy = computed(() => this.uploading() || this.removing());

  private seededFor: string | null = null;

  constructor() {
    /* Seeds per user id */
    effect(() => {
      const id = this.auth.user()?._id ?? null;
      if (!id || id === this.seededFor) return;

      this.seededFor = id;

      untracked(() => {
        const user = this.auth.user();
        if (!user) return;

        this.firstName.set(user.first_name || '');
        this.lastName.set(user.last_name || '');
        this.phoneNumber.set(user.phone_number || '');
        this.bio.set(typeof user['bio'] === 'string' ? user['bio'] : '');
      });
    });
  }

  /** Uploads immediately */
  async onImageChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Always clear the picker
    const done = () => {
      input.value = '';
    };

    if (!file.type.startsWith('image/')) {
      this.toasts.warn('Please choose an image file');
      done();
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.toasts.warn('Image is too large. Maximum size is 5MB.');
      done();
      return;
    }

    try {
      this.uploading.set(true);

      const formData = new FormData();
      formData.append('profile_picture', file);

      const body = await this.api.post<ApiEnvelope<{ user: User }>>(
        '/user/profile-picture',
        formData,
      );

      if (body?.data?.user) this.auth.patchUser(body.data.user);

      this.toasts.success('Profile picture updated');
    } catch (error) {
      this.toasts.error(getErrorMessage(error, 'Could not upload the profile picture'));
    } finally {
      this.uploading.set(false);
      done();
    }
  }

  /** Removes picture immediately */
  async handleRemovePicture(): Promise<void> {
    if (this.pictureBusy()) return;

    try {
      this.removing.set(true);

      const body = await this.api.delete<ApiEnvelope<{ user: User }>>('/user/profile-picture');

      if (body?.data?.user) this.auth.patchUser(body.data.user);

      this.toasts.success('Profile picture removed');
    } catch (error) {
      this.toasts.error(getErrorMessage(error, 'Could not remove the profile picture'));
    } finally {
      this.removing.set(false);
    }
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
      formData.append('bio', this.bio().trim());

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
