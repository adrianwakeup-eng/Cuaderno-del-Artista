import { getFontMeta } from '../data/calligraphyFonts';

const injectedFamilies = new Set<string>();
const pendingQueue = new Set<string>();
let flushTimer: number | null = null;
const BATCH_SIZE = 6;

function buildGoogleFontsUrl(families: string[]): string {
  const params = families
    .map((fam) => `family=${encodeURIComponent(fam).replace(/%20/g, '+')}`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

function injectBatch(families: string[]): void {
  if (typeof document === 'undefined' || families.length === 0) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = buildGoogleFontsUrl(families);
  link.setAttribute('data-calligraphy-batch', families.join(','));
  link.onload = () => {
    if (document.fonts && typeof document.fonts.load === 'function') {
      for (const fam of families) {
        void document.fonts.load(`28px "${fam}"`).catch(() => {});
      }
    }
  };
  document.head.appendChild(link);
}

function flushQueue(): void {
  flushTimer = null;
  if (pendingQueue.size === 0) return;
  const all = Array.from(pendingQueue);
  pendingQueue.clear();
  for (let i = 0; i < all.length; i += BATCH_SIZE) {
    injectBatch(all.slice(i, i + BATCH_SIZE));
  }
}

/**
 * Dynamically loads any of the 235+ verified Google Fonts calligraphies on demand,
 * bypassing stale index.html / PWA caches and batching cleanly in groups of 6.
 */
export function ensureCalligraphyFontLoaded(fontIdOrFamily?: string | null): void {
  if (typeof document === 'undefined' || !fontIdOrFamily) return;
  const meta = getFontMeta(fontIdOrFamily);
  const family = meta?.googleFamily || fontIdOrFamily;
  if (!family || injectedFamilies.has(family)) return;

  injectedFamilies.add(family);
  pendingQueue.add(family);

  if (flushTimer === null) {
    flushTimer = window.setTimeout(flushQueue, 20);
  }
}

export function ensureCalligraphyFontsLoaded(ids: Array<string | undefined | null>): void {
  for (const id of ids) {
    if (id) ensureCalligraphyFontLoaded(id);
  }
}

/**
 * Ensures a font is fully downloaded and ready before drawing text onto an 8K export canvas.
 */
export async function waitForCalligraphyFont(fontId?: string | null): Promise<void> {
  if (typeof document === 'undefined' || !fontId) return;
  const meta = getFontMeta(fontId);
  const family = meta.googleFamily;
  if (!injectedFamilies.has(family)) {
    injectedFamilies.add(family);
    injectBatch([family]);
  }
  if (document.fonts && typeof document.fonts.load === 'function') {
    try {
      await Promise.race([
        document.fonts.load(`32px "${family}"`),
        new Promise<void>((resolve) => window.setTimeout(resolve, 1400)),
      ]);
    } catch {
      // fallback gracefully
    }
  }
}
