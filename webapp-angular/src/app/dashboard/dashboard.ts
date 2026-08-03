import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

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
import { Page, UiStore, slugToPage } from '../state/ui.store';
import { RealtimeService } from '../core/realtime.service';
import { ToastService } from '../core/toast/toast.service';
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

  /** Covers every in-flight write */
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
  readonly deletingTask = signal<Task | null>(null);
  readonly requestTarget = signal<Task | null>(null);

  private readonly debouncedSearch = debouncedSignal(this.searchTerm, 400);

  /** Clearing skips the debounce */
  private readonly effectiveSearch = computed(() =>
    this.searchTerm() === '' ? '' : this.debouncedSearch(),
  );

  private seeded = false;

  constructor() {
    /* URL owns the section */
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const page = slugToPage(params.get('section'));

        if (page) this.ui.syncActivePage(page);
        else this.router.navigate(['/404'], { replaceUrl: true });
      });

    inject(RealtimeService).connect(() => this.user()?._id, {
      onRequestUpdated: (payload) => this.handleRequestUpdated(payload),
      onTaskUpdated: () => this.handleTaskUpdated(),
    });

    /* Untracked; prevents refetch loop */
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

    // Loads badge counts globally
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

  /* Error surfacing distinguishes failure */
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

  /* Navigates and closes panel */
  onNotificationNavigate(page: Page): void {
    this.ui.setActivePage(page);
    this.ui.toggleNotifications(false);
  }

  /** Warns about cancelled applications */
  deleteMessage(task: Task): string {
    return `Delete "${task.title}"? Anyone who applied will be told it has been closed.`;
  }

  async handleDeleteTask(task: Task): Promise<void> {
    const result = await this.tasks.deleteTask(task._id);

    this.deletingTask.set(null);

    if (!result.ok) {
      this.toasts.error(result.error);
      return;
    }

    this.toasts.success('Task deleted');
    // Badge count now stale
    this.requests.fetchReceived();
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
