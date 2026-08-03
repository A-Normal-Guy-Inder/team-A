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

/* Menu sections only */
export const NAV_PAGES = PAGES.filter((page) => page !== 'Add Task');

/* URL segment per section */
export const PAGE_SLUGS: Record<Page, string> = {
  Feed: 'feed',
  'My Tasks': 'my-tasks',
  Requests: 'requests',
  'My Requests': 'my-requests',
  'Add Task': 'add-task',
  Settings: 'settings',
};

/* Subtitle per section */
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

  /** Navigates; syncActivePage writes state */
  setActivePage(page: string, { replaceUrl = false }: { replaceUrl?: boolean } = {}): void {
    if (!PAGES.includes(page as Page)) return;
    if (page === this.state().activePage) return;

    this.router.navigate(['/Dashboard', pageToSlug(page as Page)], { replaceUrl });
  }

  /** Applies URL section */
  syncActivePage(page: Page): void {
    this.state.update((s) => ({ ...s, activePage: page, showMenu: false }));
  }

  setSearchTerm(searchTerm: string): void {
    this.state.update((s) => ({ ...s, searchTerm }));
  }

  setShowMenu(showMenu: boolean): void {
    this.state.update((s) => ({ ...s, showMenu }));
  }

  /** Value forces; omitted toggles */
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
