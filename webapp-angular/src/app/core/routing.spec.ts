import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { ApiService } from './api.service';
import { NotFound } from '../shared/not-found/not-found';
import { NAV_PAGES, PAGES, Page, UiStore, pageToSlug, slugToPage } from '../state/ui.store';

/* Section and 404 routing */
describe('routing', () => {
  describe('dashboard section slugs', () => {
    it('round-trips every page through its slug', () => {
      for (const page of PAGES) {
        expect(slugToPage(pageToSlug(page))).toBe(page);
      }
    });

    it('produces URL-safe slugs', () => {
      for (const page of PAGES) {
        expect(pageToSlug(page)).toMatch(/^[a-z-]+$/);
      }
    });

    it('accepts a slug regardless of case', () => {
      expect(slugToPage('MY-TASKS')).toBe('My Tasks');
    });

    it('rejects anything that is not a section', () => {
      expect(slugToPage('bogus')).toBeNull();
      expect(slugToPage('')).toBeNull();
      expect(slugToPage(null)).toBeNull();
    });
  });

  /* NAV_PAGES is narrower */
  describe('navigable sections', () => {
    it('leaves Add Task out of the menus', () => {
      expect(NAV_PAGES).not.toContain('Add Task');
    });

    it('lists everything else', () => {
      expect(NAV_PAGES).toEqual(PAGES.filter((page) => page !== 'Add Task'));
    });

    it('only lists real sections', () => {
      for (const page of NAV_PAGES) {
        expect(slugToPage(pageToSlug(page))).toBe(page);
      }
    });
  });

  describe('UiStore.setActivePage', () => {
    function setup() {
      const navigations: { commands: unknown[]; extras?: { replaceUrl?: boolean } }[] = [];

      TestBed.configureTestingModule({
        providers: [
          UiStore,
          {
            provide: Router,
            useValue: {
              navigate: (commands: unknown[], extras?: { replaceUrl?: boolean }) =>
                navigations.push({ commands, extras }),
            },
          },
        ],
      });

      return { store: TestBed.inject(UiStore), navigations };
    }

    it('changes section by navigating, so the URL records it', () => {
      const { store, navigations } = setup();

      store.setActivePage('My Requests');

      expect(navigations.map((n) => n.commands)).toEqual([['/Dashboard', 'my-requests']]);
    });

    it('pushes onto the history by default', () => {
      const { store, navigations } = setup();

      store.setActivePage('My Requests');

      expect(navigations[0].extras?.replaceUrl).toBe(false);
    });

    /* Back skips the form */
    it('replaces the current entry when asked', () => {
      const { store, navigations } = setup();

      store.syncActivePage('Add Task' as Page);
      store.setActivePage('My Tasks', { replaceUrl: true });

      expect(navigations[0].commands).toEqual(['/Dashboard', 'my-tasks']);
      expect(navigations[0].extras?.replaceUrl).toBe(true);
    });

    it('ignores a page that is not a real section', () => {
      const { store, navigations } = setup();

      store.setActivePage('Nonsense');

      expect(navigations).toHaveLength(0);
    });

    it('does not navigate when already on the requested section', () => {
      const { store, navigations } = setup();

      store.syncActivePage('Feed' as Page);
      store.setActivePage('Feed');

      expect(navigations).toHaveLength(0);
    });

    it('applies a URL-driven section without navigating again', () => {
      const { store, navigations } = setup();

      store.syncActivePage('Settings' as Page);

      expect(store.activePage()).toBe('Settings');
      expect(navigations).toHaveLength(0);
    });
  });

  describe('unknown addresses', () => {
    @Component({ template: '' })
    class Host {}

    async function navigateTo(url: string) {
      TestBed.configureTestingModule({
        providers: [
          provideRouter(routes),
          { provide: ApiService, useValue: { get: async () => ({ data: {} }), post: async () => ({}) } },
        ],
      });

      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(url);
      return harness;
    }

    it('renders the 404 page for an unrecognised URL', async () => {
      const harness = await navigateTo('/no-such-page');

      expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(NotFound);
      expect(harness.fixture.nativeElement.textContent).toContain('404');
      expect(harness.fixture.nativeElement.textContent).toContain('Page not found');
    });

    it('does not send unknown URLs to the login form', async () => {
      const harness = await navigateTo('/no-such-page');

      expect(TestBed.inject(Router).url).not.toContain('login');
    });

    it('serves the 404 page at its own address', async () => {
      const harness = await navigateTo('/404');

      expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(NotFound);
    });
  });

  describe('route table', () => {
    it('points bare /Dashboard at the feed section', () => {
      const bare = routes.find((r) => r.path === 'Dashboard');

      expect(bare?.redirectTo).toBe('Dashboard/feed');
      expect(bare?.pathMatch).toBe('full');
    });

    it('carries the section as a URL parameter', () => {
      expect(routes.some((r) => r.path === 'Dashboard/:section')).toBe(true);
    });

    it('keeps the dashboard behind a guard', () => {
      const section = routes.find((r) => r.path === 'Dashboard/:section');

      expect(section?.canActivate?.length).toBeGreaterThan(0);
    });
  });
});
