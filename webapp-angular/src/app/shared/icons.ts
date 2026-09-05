import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/* Inlined lucide outlines */

@Component({
  selector: 'app-icon-eye',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icons/icon-eye.html',
})
export class IconEye {
  readonly size = input(18);
}

@Component({
  selector: 'app-icon-eye-off',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icons/icon-eye-off.html',
})
export class IconEyeOff {
  readonly size = input(18);
}

@Component({
  selector: 'app-icon-bell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icons/icon-bell.html',
})
export class IconBell {
  readonly size = input(25);
}

@Component({
  selector: 'app-icon-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icons/icon-upload.html',
})
export class IconUpload {
  readonly size = input(24);
}

@Component({
  selector: 'app-icon-x',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icons/icon-x.html',
})
export class IconX {
  readonly size = input(14);
}

export const ICONS = [IconEye, IconEyeOff, IconBell, IconUpload, IconX];
