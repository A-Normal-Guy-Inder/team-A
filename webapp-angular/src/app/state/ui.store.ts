import { Injectable, computed, signal } from '@angular/core';

export const PAGES = [
  'Feed',
  'My Tasks',
  'Requests',
  'My Requests',
  'Add Task',
  'Settings',
] as const;

export type Page = (typeof PAGES)[number];

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
  private readonly state = signal<UiState>(initialState);

  readonly activePage = computed(() => this.state().activePage);
  readonly searchTerm = computed(() => this.state().searchTerm);
  readonly showMenu = computed(() => this.state().showMenu);
  readonly showNotifications = computed(() => this.state().showNotifications);
  readonly showLogoutConfirm = computed(() => this.state().showLogoutConfirm);

  setActivePage(page: string): void {
    if (!PAGES.includes(page as Page)) return;
    this.state.update((s) => ({ ...s, activePage: page as Page, showMenu: false }));
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
