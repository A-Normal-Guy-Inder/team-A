import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { UpdateProfile } from './update-profile/update-profile';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UpdateProfile],
  template: `
    <div class="settings-container">
      <app-update-profile />

      <div class="settings-card">
        <h3>Change Email</h3>
        <button class="settings-save-btn" (click)="go('/change-email')">Change Email</button>
      </div>

      <div class="settings-card">
        <h3>Change Password</h3>
        <button class="settings-save-btn" (click)="go('/change-password')">Change Password</button>
      </div>
    </div>
  `,
})
export class Settings {
  private readonly router = inject(Router);

  go(path: string): void {
    this.router.navigate([path]);
  }
}
