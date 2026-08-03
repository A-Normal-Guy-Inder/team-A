import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export const PAGES = [
  'Feed',
  'My Tasks',
  'Requests',
  'My Requests',
  'Add Task',
  'Settings',
] as const;

export type Page = (typeof PAGES)[number];

/*
 * What the sidebar and the mobile drawer list. Add Task is a real section with
 * its own URL, but it is not somewhere you go looking — it is what you do to a
 * task list, so it is reached by the button on My Tasks and left again as soon
 * as the form is done with.
 */
export const NAV_PAGES = PAGES.filter((page) => page !== 'Add Task');

/*
 * Each section has a URL segment, because the section is part of where the user
 * is — not just a detail of how the dashboard happens to be rendering. Keeping
 * it in the URL is what makes a reload, a bookmark and the back button all land
 * on the page the user was actually looking at.
 */
export const PAGE_SLUGS: Record<Page, string> = {
  Feed: 'feed',
  'My Tasks': 'my-tasks',
  Requests: 'requests',
  'My Requests': 'my-requests',
  'Add Task': 'add-task',
  Settings: 'settings',
};

/*
 * A line of orientation under each heading. Kept beside the page list so a new
 * section cannot be added without deciding what it is for.
 */
export const PAGE_SUBTITLES: Record<Page, string> = {
  Feed: 'Browse tasks people nearby need help with',
  'My Tasks': "Tasks you've posted, and how they are doing",
  Requests: 'People offering to help with your tasks',
  'My Requests': "Tasks you've offered to help with",
  'Add Task': 'Describe what you need help with',
  Settings: 'Manage your profile and account security',
};

const SLUG_TO_PAGE = new Map<string, Page>(
  (Object.entries(PAGE_SLUGS) as [Page, string][]).map(([page, slug]) => [slug, page]),
);

export function pageToSlug(page: Page): string {
  return PAGE_SLUGS[page];
}

export function slugToPage(slug: string | null | undefined): Page | null {
  if (!slug) return null;
  return SLUG_TO_PAGE.get(slug.toLowerCase()) ?? null;
}

interface UiState {
  activePage: Page;
  searchTerm: string;
  showMenu: boolean;
  showNotifications: boolean;
  showLogoutConfirm: boolean;
  busy: boolean;
}

const initialState: UiState = {
  activePage: 'Feed',
  searchTerm: '',
  showMenu: false,
  showNotifications: false,
  showLogoutConfirm: false,
  busy: false,
};

@Injectable({ providedIn: 'root' })
export class UiStore {
  private readonly router = inject(Router);
  private readonly state = signal<UiState>(initialState);

  readonly activePage = computed(() => this.state().activePage);
  readonly searchTerm = computed(() => this.state().searchTerm);
  readonly showMenu = computed(() => this.state().showMenu);
  readonly showNotifications = computed(() => this.state().showNotifications);
  readonly showLogoutConfirm = computed(() => this.state().showLogoutConfirm);

  /**
   * Moves to a section. This is a navigation rather than a plain state write —
   * the URL is the source of truth for which section is open, and `syncActivePage`
   * below is what actually updates the state once the router has moved.
   *
   * `replaceUrl` drops the section being left out of the history instead of
   * stacking on top of it, for a page there is no sense in going Back to.
   */
  setActivePage(page: string, { replaceUrl = false }: { replaceUrl?: boolean } = {}): void {
    if (!PAGES.includes(page as Page)) return;
    if (page === this.state().activePage) return;

    this.router.navigate(['/Dashboard', pageToSlug(page as Page)], { replaceUrl });
  }

  /**
   * Applies the section the URL is currently pointing at. Does not navigate —
   * the navigation is what called this.
   */
  syncActivePage(page: Page): void {
    this.state.update((s) => ({ ...s, activePage: page, showMenu: false }));
  }

  setSearchTerm(searchTerm: string): void {
    this.state.update((s) => ({ ...s, searchTerm }));
  }

  setShowMenu(showMenu: boolean): void {
    this.state.update((s) => ({ ...s, showMenu }));
  }

  /** Passing a value forces it; omitting it toggles, as the reducer did. */
  toggleNotifications(next?: boolean): void {
    this.state.update((s) => ({ ...s, showNotifications: next ?? !s.showNotifications }));
  }

  setShowLogoutConfirm(showLogoutConfirm: boolean): void {
    this.state.update((s) => ({ ...s, showLogoutConfirm }));
  }

  setBusy(busy: boolean): void {
    this.state.update((s) => ({ ...s, busy }));
  }

  reset(): void {
    this.state.set(initialState);
  }
}
