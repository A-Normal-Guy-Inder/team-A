import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';

import { Sidebar } from './sidebar/sidebar';
import { Topbar } from './topbar/topbar';
import { MobileMenu } from './mobile-menu/mobile-menu';
import { FeedPage } from './pages/feed-page';
import { MyTasksPage } from './pages/my-tasks-page';
import { ReceivedRequestsPage } from './pages/received-requests-page';
import { SentRequestsPage } from './pages/sent-requests-page';
import { AddTaskPage } from './pages/add-task-page';
import { EditTaskModal } from './modals/edit-task-modal';
import { SendRequestModal } from './modals/send-request-modal';
import { ConfirmModal } from './modals/confirm-modal';
import { Settings } from '../settings/settings';
import { Loader } from '../shared/loader/loader';

import { AuthStore } from '../state/auth.store';
import { TasksStore } from '../state/tasks.store';
import { RequestsStore } from '../state/requests.store';
import { NotificationsStore } from '../state/notifications.store';
import { Page, UiStore } from '../state/ui.store';
import { RealtimeService } from '../core/realtime.service';
import { ToastService } from '../core/toast/toast.service';
import { readNavigationState } from '../core/navigation-state';
import { debouncedSignal } from '../shared/debounced';
import { Task } from '../core/api.types';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Sidebar,
    Topbar,
    MobileMenu,
    FeedPage,
    MyTasksPage,
    ReceivedRequestsPage,
    SentRequestsPage,
    AddTaskPage,
    EditTaskModal,
    SendRequestModal,
    ConfirmModal,
    Settings,
    Loader,
  ],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStore);
  private readonly tasks = inject(TasksStore);
  private readonly requests = inject(RequestsStore);
  private readonly notifications = inject(NotificationsStore);
  private readonly toasts = inject(ToastService);

  readonly ui = inject(UiStore);

  readonly user = this.auth.user;
  readonly activePage = this.ui.activePage;
  readonly searchTerm = this.ui.searchTerm;
  readonly showMenu = this.ui.showMenu;
  readonly showNotifications = this.ui.showNotifications;
  readonly showLogoutConfirm = this.ui.showLogoutConfirm;
  readonly pendingCount = this.requests.pendingCount;
  readonly notificationItems = this.notifications.items;
  readonly notificationsMeta = this.notifications.meta;
  readonly unreadCount = this.notifications.unreadCount;
  readonly logoutPending = this.auth.logoutPending;

  /** One overlay covers every in-flight write, exactly as the React `busy` flag did. */
  readonly busy = computed(
    () =>
      this.tasks.saving() ||
      this.requests.sending() ||
      this.auth.logoutPending() ||
      Object.keys(this.requests.actionInFlight()).length > 0,
  );

  readonly canLoadMoreNotifications = computed(() =>
    Boolean(this.notificationsMeta().hasNextPage),
  );

  readonly editingTask = signal<Task | null>(null);
  readonly requestTarget = signal<Task | null>(null);

  private readonly debouncedSearch = debouncedSignal(this.searchTerm, 400);

  /** Clearing the box refetches at once; typing waits out the debounce. */
  private readonly effectiveSearch = computed(() =>
    this.searchTerm() === '' ? '' : this.debouncedSearch(),
  );

  private seeded = false;

  constructor() {
    const state = readNavigationState<{ openPage?: string }>(this.router);
    if (state.openPage) {
      this.ui.setActivePage(state.openPage);
      // Consume it, or a reload would keep forcing the same page open.
      history.replaceState({ ...history.state, openPage: undefined }, '');
    }

    inject(RealtimeService).connect(() => this.user()?._id, {
      onRequestUpdated: (payload) => this.handleRequestUpdated(payload),
      onTaskUpdated: () => this.handleTaskUpdated(),
    });

    /*
     * Whichever list the active page shows, reload it when the page or the
     * search term changes.
     *
     * The two signals read above the `untracked` boundary are the entire
     * dependency set, deliberately. A fetch writes to its store, so if the call
     * were tracked the write would re-run this effect and fetch again, forever —
     * that is exactly what locked up the browser on the dashboard.
     */
    effect(() => {
      const page = this.activePage();
      const search = this.effectiveSearch();

      untracked(() => {
        if (page === 'Feed') this.tasks.fetchFeed({ search, page: 1 });
        else if (page === 'My Tasks') this.tasks.fetchMyTasks({ search, page: 1 });
        else if (page === 'Requests') this.requests.fetchReceived({ search, page: 1 });
        else if (page === 'My Requests') this.requests.fetchSent({ search, page: 1 });
      });
    });

    // Runs once the session is known: the bell and the Requests badge need
    // their counts even on a page that does not otherwise load them.
    effect(() => {
      const userId = this.user()?._id;
      if (!userId || this.seeded) return;
      this.seeded = true;

      untracked(() => {
        this.notifications.fetch({ page: 1 });
        if (this.activePage() !== 'Requests') this.requests.fetchReceived({ page: 1 });
      });
    });
  }

  private handleRequestUpdated(payload: unknown): void {
    const scope = (payload as { scope?: string } | null)?.scope;

    if (scope === 'received') this.requests.fetchReceived();
    if (scope === 'sent' && this.activePage() === 'My Requests') this.requests.fetchSent();
  }

  private handleTaskUpdated(): void {
    if (this.activePage() === 'Feed') this.tasks.fetchFeed();
    if (this.activePage() === 'My Tasks') this.tasks.fetchMyTasks();
  }

  onNavigate(page: string): void {
    this.ui.setActivePage(page);
  }

  onMenuNavigate(page: string): void {
    this.ui.setActivePage(page);
    this.ui.setShowMenu(false);
  }

  onMenuLogout(): void {
    this.ui.setShowMenu(false);
    this.ui.setShowLogoutConfirm(true);
  }

  /*
   * The store only commits the read state once the server confirms it, so a
   * failure leaves the row exactly as it was — visually identical to the click
   * never having registered. Surfacing the error is what tells the two apart.
   * It matters most for the dropdown's cross icon, where going read is the only
   * feedback the button has.
   */
  async onMarkRead(id: string): Promise<void> {
    const result = await this.notifications.markRead(id);
    if (!result.ok) this.toasts.error(result.error);
  }

  async onMarkAllRead(): Promise<void> {
    const result = await this.notifications.markAllRead();
    if (!result.ok) this.toasts.error(result.error);
  }

  async onLoadMoreNotifications(): Promise<void> {
    const result = await this.notifications.fetch({
      page: (this.notificationsMeta().page || 1) + 1,
    });
    if (!result.ok) this.toasts.error(result.error);
  }

  /*
   * Opening a notification lands on the page it is about. The panel closes with
   * it — leaving it hanging over the page you just asked to see would hide the
   * row you came to look at.
   */
  onNotificationNavigate(page: Page): void {
    this.ui.setActivePage(page);
    this.ui.toggleNotifications(false);
  }

  async handleLogout(): Promise<void> {
    const result = await this.auth.logout();

    if (!result.ok) {
      this.toasts.error('Logout failed');
      return;
    }

    this.toasts.success('Logged out successfully 👋');
    this.ui.setShowLogoutConfirm(false);
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
