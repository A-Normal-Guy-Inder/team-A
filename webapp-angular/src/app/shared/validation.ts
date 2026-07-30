export const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_SPECIAL = /[!@#$%^&*()_+\-=[\]{};:'",.<>/?\\|`~]/;

export interface TaskFormValues {
  title?: string;
  category?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}

export const isValidEmail = (email: unknown): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim());

export const isValidPhone = (phone: unknown): boolean =>
  /^[6-9]\d{9}$/.test(String(phone ?? '').trim());

export function checkPasswordStrength(password: unknown): { isStrong: boolean; message: string } {
  const value = String(password ?? '');

  if (value.length < PASSWORD_MIN_LENGTH) {
    return {
      isStrong: false,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    };
  }
  if (!/[A-Z]/.test(value)) {
    return { isStrong: false, message: 'Password must contain at least one uppercase letter (A-Z)' };
  }
  if (!/[a-z]/.test(value)) {
    return { isStrong: false, message: 'Password must contain at least one lowercase letter (a-z)' };
  }
  if (!/[0-9]/.test(value)) {
    return { isStrong: false, message: 'Password must contain at least one number (0-9)' };
  }
  if (!PASSWORD_SPECIAL.test(value)) {
    return {
      isStrong: false,
      message: 'Password must contain at least one special character (!@#$%^&*)',
    };
  }

  return { isStrong: true, message: 'Password is strong' };
}

export const isStrongPassword = (password: unknown): boolean =>
  checkPasswordStrength(password).isStrong;

export function validateTaskForm(
  form: TaskFormValues,
  mode: 'create' | 'edit' = 'create',
): string | null {
  if (!form.title?.trim()) return 'Task title is required';
  if (form.title.trim().length < 3) return 'Title must be at least 3 characters';
  if (!form.category) return 'Please select a category';
  if (!form.location?.trim()) return 'Location is required';
  if (!form.startDate) return 'Start date is required';
  if (!form.endDate) return 'End date is required';

  const start = new Date(form.startDate).getTime();
  const end = new Date(form.endDate).getTime();

  if (Number.isNaN(start)) return 'Start date is invalid';
  if (Number.isNaN(end)) return 'End date is invalid';
  if (start >= end) return 'Start Time must be earlier than End Time.';

  if (mode === 'create' && start < Date.now() - 60_000) {
    return 'Start Time cannot be in the past.';
  }
  if (mode === 'edit' && end < Date.now()) {
    return 'End Time cannot be in the past.';
  }

  return null;
}
