const KEY = "memory-palace-data-v1";

export function loadPalaces() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePalaces(palaces) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(palaces));
    return true;
  } catch {
    return false;
  }
}
