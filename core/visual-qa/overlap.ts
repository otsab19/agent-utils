/**
 * Visual/Spatial QA — DOM Overlap Detection
 *
 * Detects bounding-box overlaps between interactive elements.
 * Runs inside the Playwright page context via page.evaluate().
 */

export interface OverlapReport {
  totalElements: number;
  overlappingPairs: Array<{
    elementA: string;
    elementB: string;
    overlapArea: number;
  }>;
  hasOverlaps: boolean;
}

/**
 * Playwright page.evaluate-compatible function that detects element overlaps.
 * Must be serializable (no external imports) — this runs in browser context.
 */
export const detectOverlapsInBrowser = (): OverlapReport => {
  const selectors = 'button, a, input, [role="button"], [role="link"], img, .card, section';
  const elements = Array.from(document.querySelectorAll(selectors));
  const rects = elements.map((el) => ({
    el: (el as HTMLElement).tagName + (el.id ? `#${el.id}` : '') + (el.className ? `.${String(el.className).split(' ')[0]}` : ''),
    rect: (el as HTMLElement).getBoundingClientRect(),
  }));

  const overlappingPairs: OverlapReport['overlappingPairs'] = [];

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i].rect;
      const b = rects[j].rect;

      const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const overlapArea = xOverlap * yOverlap;

      if (overlapArea > 0) {
        overlappingPairs.push({
          elementA: rects[i].el,
          elementB: rects[j].el,
          overlapArea,
        });
      }
    }
  }

  return {
    totalElements: elements.length,
    overlappingPairs,
    hasOverlaps: overlappingPairs.length > 0,
  };
};
