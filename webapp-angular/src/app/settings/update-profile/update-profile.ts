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

/** Matches the 500-character cap the user schema enforces. */
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

  /*
   * The picture and the address are not edited by this form — the buttons above
   * set the one, the change-email flow sets the other — so both simply follow
   * the session rather than being copied into local state that could go stale.
   */
  readonly preview = computed(() => this.auth.user()?.profile_picture || '');
  readonly email = computed(() => this.auth.user()?.email_id || '');

  /** Offered only when there is something stored to remove. */
  readonly canRemovePicture = computed(() => Boolean(this.auth.user()?.profile_picture));

  /** True while either picture button is mid-flight; each disables the other. */
  readonly pictureBusy = computed(() => this.uploading() || this.removing());

  private seededFor: string | null = null;

  constructor() {
    /*
     * Fills the editable fields once per signed-in user.
     *
     * Keyed on the id rather than the user object on purpose: the picture
     * buttons write the updated user back through patchUser while the form is
     * open, and re-seeding on that would throw away a name or bio the user had
     * typed but not yet saved.
     */
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

  /**
   * Uploads the chosen file straight away, the mirror of removing one below.
   *
   * Both controls now commit on the spot, so the picture never sits in the form
   * as an unsaved choice — which is what made "Remove" ambiguous while a file
   * was pending, and what made Save Changes silently responsible for two
   * unrelated things.
   */
  async onImageChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // The picker is cleared either way: on success the stored picture is the
    // one that counts, and on failure a rejected file left in the input would
    // not fire `change` again if it were picked a second time.
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

  /** Removes the stored picture immediately — the counterpart of the upload above. */
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
