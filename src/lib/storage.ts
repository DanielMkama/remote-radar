/**
 * A tiny external store over a single localStorage key, exposed via
 * `useSyncExternalStore` (see the two contexts in src/context/). This is the
 * React-recommended way to read state that can differ between the server
 * render and the client (localStorage doesn't exist on the server) without
 * the "read in an effect, then setState" pattern, which causes an extra
 * render and trips React's set-state-in-effect lint rule.
 *
 * Phase 1 uses localStorage instead of a database for saved jobs and
 * settings (no auth yet, so there's no user to attach server-side records
 * to).
 */

type Listener = () => void;

export function createLocalStorageStore<T>(key: string, fallback: T) {
  let cache: T = fallback;
  let hasReadFromStorage = false;
  const listeners = new Set<Listener>();

  function readFromStorage(): T {
    try {
      const raw = window.localStorage.getItem(key);
      return raw == null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  /** Client snapshot: lazily read localStorage once, then serve the cache. */
  function getSnapshot(): T {
    if (!hasReadFromStorage) {
      cache = readFromStorage();
      hasReadFromStorage = true;
    }
    return cache;
  }

  /** Server snapshot: always the fallback, since there's no localStorage on the server. */
  function getServerSnapshot(): T {
    return fallback;
  }

  function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    const onStorageEvent = (event: StorageEvent) => {
      if (event.key !== key) return;
      cache = readFromStorage();
      listener();
    };
    window.addEventListener("storage", onStorageEvent);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorageEvent);
    };
  }

  function set(value: T): void {
    cache = value;
    hasReadFromStorage = true;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore write failures (quota exceeded, private mode, etc.)
    }
    listeners.forEach((listener) => listener());
  }

  return { getSnapshot, getServerSnapshot, subscribe, set };
}

export const STORAGE_KEYS = {
  savedJobs: "rdr:saved-job-ids",
  preferences: "rdr:preferences",
} as const;
