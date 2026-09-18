// Cross-component signal for "the entrance preloader has finished." Kept as plain
// browser APIs (sessionStorage + a window event) rather than React context so it can be
// read from any client component — including ones that mount before or after the
// Preloader itself — without prop drilling.

const STORAGE_KEY = "aurum-preloaded";
const EVENT = "aurum:preloaded";

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
