// Cross-component signal for "the entrance invitation has finished." Kept as plain
// browser APIs (sessionStorage + a window event) rather than React context so it can be
// read from any client component — including ones that mount before or after the
// Preloader itself — without prop drilling.

const STORAGE_KEY = "aurum-preloaded";
const EVENT = "aurum:preloaded";

/** Set on <html> before first paint when the invitation should not show this visit. */
export const PRELOADER_SKIP_ATTR = "data-ae-skip";

/**
 * Inline <head> script. The invitation is server-rendered so the homepage never flashes
 * before the envelope appears; this hides it again, before paint, for visitors who have
 * already opened it this session or who prefer reduced motion.
 */
export const preloaderSkipScript = `try{if(sessionStorage.getItem("${STORAGE_KEY}")==="1"||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.setAttribute("${PRELOADER_SKIP_ATTR}","")}catch(e){}`;

export function hasPreloaded(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markPreloaderDone() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // storage unavailable — the event still fires, so this session behaves correctly
  }
  window.dispatchEvent(new Event(EVENT));
}

export function onPreloaderDone(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}
