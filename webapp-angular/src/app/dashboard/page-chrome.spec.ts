import { PAGES, PAGE_SUBTITLES, Page } from '../state/ui.store';

/*
 * The subtitle map is keyed by Page, so a missing entry is a type error rather
 * than a blank line in the UI. What the type cannot catch is an entry that
 * exists but says nothing useful, or one left identical to the heading it sits
 * under — which is what these check.
 */
describe('dashboard page subtitles', () => {
  it('covers every section', () => {
    for (const page of PAGES) {
      expect(PAGE_SUBTITLES[page as Page]).toBeTruthy();
    }
  });

  it('says something beyond repeating the heading', () => {
    for (const page of PAGES) {
      const subtitle = PAGE_SUBTITLES[page as Page];

      expect(subtitle.toLowerCase()).not.toBe(page.toLowerCase());
      expect(subtitle.length).toBeGreaterThan(10);
    }
  });

  it('keeps them short enough for one line in the topbar', () => {
    for (const page of PAGES) {
      expect(PAGE_SUBTITLES[page as Page].length).toBeLessThanOrEqual(60);
    }
  });

  it('gives each section its own wording', () => {
    const seen = new Set(PAGES.map((page) => PAGE_SUBTITLES[page as Page]));

    expect(seen.size).toBe(PAGES.length);
  });
});
