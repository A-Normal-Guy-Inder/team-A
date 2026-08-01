import { AppNotification } from './api.types';
import { Page } from '../state/ui.store';

/*
 * Which dashboard page a notification is about.
 *
 * The keys are the `type` strings the backend writes in
 * services/request.service.js — they are the contract, so a type that is not
 * listed here (today: the "general" default) simply has no destination and the
 * notification stays inert rather than guessing a page.
 *
 * The direction matters and is easy to get backwards: `request_received` is
 * delivered to the task *owner*, so it opens the received-requests page
 * ("Requests"). `request_accepted` / `request_rejected` are delivered to the
 * *requester*, so they open the page listing the requests that person sent
 * ("My Requests").
 */
const PAGE_BY_TYPE: Readonly<Record<string, Page>> = {
  request_received: 'Requests',
  request_accepted: 'My Requests',
  request_rejected: 'My Requests',
};

/** The page this notification should open, or `null` if it has no destination. */
export function notificationTargetPage(note: AppNotification): Page | null {
  return PAGE_BY_TYPE[note.type ?? ''] ?? null;
}
