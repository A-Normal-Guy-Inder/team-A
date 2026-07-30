import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { IconUpload } from '../../shared/icons';
import { ToastService } from '../../core/toast/toast.service';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface ImageSelection {
  file: File;
  preview: string;
}

@Component({
  selector: 'app-image-upload-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconUpload],
  template: `
    @if (preview()) {
      <div class="image-preview-container">
        <img [src]="preview()" alt="Preview" class="image-preview" />
        <button type="button" class="btn-remove-image" (click)="remove.emit()">
          ✕ Remove Image
        </button>
      </div>
    } @else {
      <div class="file-upload" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
        <input type="file" [id]="inputId()" accept="image/*" (change)="onFileInput($event)" />
        <label [attr.for]="inputId()" class="file-upload-label">
          <span><app-icon-upload /></span>Upload a file or drag and drop
          <span>PNG, JPG, GIF up to 5MB</span>
        </label>
      </div>
    }
  `,
})
export class ImageUploadField {
  private readonly toasts = inject(ToastService);

  readonly inputId = input('task-image');
  readonly preview = input<string | null>(null);

  readonly select = output<ImageSelection>();
  readonly remove = output<void>();

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.handleFile(input.files?.[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) this.handleFile(file);
    else this.toasts.warn('Please drop an image file');
  }

  private handleFile(file: File | undefined): void {
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      this.toasts.warn('Please choose a JPG, PNG, WEBP or GIF image');
      return;
    }
    if (file.size > MAX_BYTES) {
      this.toasts.warn('Image is too large. Maximum size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => this.select.emit({ file, preview: String(reader.result) });
    reader.readAsDataURL(file);
  }
}
