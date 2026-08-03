import { AppNotification } from './api.types';
import { Page } from '../state/ui.store';

/* Notification type to page */
const PAGE_BY_TYPE: Readonly<Record<string, Page>> = {
  request_received: 'Requests',
  request_accepted: 'My Requests',
  request_rejected: 'My Requests',
};

/** Target page, or null */
export function notificationTargetPage(note: AppNotification): Page | null {
  return PAGE_BY_TYPE[note.type ?? ''] ?? null;
}
