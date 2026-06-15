import { KEYS, NAMESPACE } from "./storageKeys";
import type { StorageKeyConfig, StorageOptions, StorageValueMap } from "./storage.types";

const PROBE_KEY = `${NAMESPACE}__probe__`;

/**
 * Typed, safe wrapper around `localStorage`.
 *
 * - **Never throws.** When `localStorage` is unavailable (SSR, private mode,
 *   sandboxed iframe) or errors (quota), it transparently falls back to an
 *   in-memory `Map` for the lifetime of the instance.
 * - **JSON-safe.** (De)serializes JSON by default and returns the provided
 *   fallback on parse failure. `raw: true` keys are read/written as plain strings.
 * - **Namespaced.** Canonical keys live under `verifywise_` (see `storageKeys.ts`).
 *
 * Mirrors the try/catch + `console.warn` style of
 * `application/utils/paginationStorage.ts`.
 */
export class StorageService {
  private readonly memory = new Map<string, string>();
  private readonly backend: Storage | null;

  constructor() {
    this.backend = StorageService.resolveBackend();
  }

  /** Detect a working `localStorage`, probing once. Returns null if unusable. */
  private static resolveBackend(): Storage | null {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    try {
      window.localStorage.setItem(PROBE_KEY, "1");
      window.localStorage.removeItem(PROBE_KEY);
      return window.localStorage;
    } catch {
      return null;
    }
  }

  // The backend and the in-memory Map are mutually exclusive: the constructor
  // probe decides once. When `backend` is null every operation uses `memory`;
  // otherwise the backend is the single source of truth and transient failures
  // (e.g. quota) are swallowed with a warning so callers never see a throw.

  private readString(key: string): string | null {
    if (!this.backend) {
      return this.memory.has(key) ? (this.memory.get(key) as string) : null;
    }
    try {
      return this.backend.getItem(key);
    } catch (error) {
      console.warn(`StorageService: failed to read "${key}":`, error);
      return null;
    }
  }

  private writeString(key: string, value: string): void {
    if (!this.backend) {
      this.memory.set(key, value);
      return;
    }
    try {
      this.backend.setItem(key, value);
    } catch (error) {
      console.warn(`StorageService: failed to write "${key}":`, error);
    }
  }

  private deleteString(key: string): void {
    if (!this.backend) {
      this.memory.delete(key);
      return;
    }
    try {
      this.backend.removeItem(key);
    } catch (error) {
      console.warn(`StorageService: failed to remove "${key}":`, error);
    }
  }

  /** Read `key`, migrating from `opts.legacyKey` on first access if needed. */
  private readWithLegacy(key: string, opts: StorageOptions): string | null {
    const current = this.readString(key);
    if (current !== null || !opts.legacyKey) {
      return current;
    }
    const legacy = this.readString(opts.legacyKey);
    if (legacy === null) {
      return null;
    }
    // One-time migration: copy to the canonical key, drop the legacy one.
    this.writeString(key, legacy);
    this.deleteString(opts.legacyKey);
    return legacy;
  }

  // --- Raw, string-keyed accessors (factory keys + escape hatch) ---

  getRaw<T>(key: string, fallback: T, opts: StorageOptions = {}): T {
    const stored = this.readWithLegacy(key, opts);
    if (stored === null) {
      return fallback;
    }
    if (opts.raw) {
      return stored as unknown as T;
    }
    try {
      return JSON.parse(stored) as T;
    } catch (error) {
      console.warn(`StorageService: failed to parse JSON for "${key}":`, error);
      return fallback;
    }
  }

  setRaw<T>(key: string, value: T, opts: StorageOptions = {}): void {
    const serialized = opts.raw ? String(value) : JSON.stringify(value);
    this.writeString(key, serialized);
  }

  remove(key: string): void {
    this.deleteString(key);
  }

  // --- Typed, registry-driven accessors ---

  get<K extends keyof StorageValueMap>(name: K, fallback: StorageValueMap[K]): StorageValueMap[K] {
    const config: StorageKeyConfig = KEYS[name];
    return this.getRaw(config.key, fallback, config);
  }

  set<K extends keyof StorageValueMap>(name: K, value: StorageValueMap[K]): void {
    const config: StorageKeyConfig = KEYS[name];
    this.setRaw(config.key, value, config);
  }

  removeKey<K extends keyof StorageValueMap>(name: K): void {
    this.remove(KEYS[name].key);
  }

  /**
   * Remove only VerifyWise-namespaced (`verifywise_*`) keys — e.g. on logout —
   * leaving auth (`token`) and redux-persist (`persist:root`) entries intact.
   */
  clearNamespace(): void {
    const toDelete: string[] = [];
    if (this.backend) {
      try {
        for (let i = 0; i < this.backend.length; i++) {
          const k = this.backend.key(i);
          if (k && k.startsWith(NAMESPACE)) {
            toDelete.push(k);
          }
        }
      } catch (error) {
        console.warn("StorageService: failed to enumerate keys:", error);
      }
    }
    toDelete.forEach((k) => this.deleteString(k));
    for (const k of Array.from(this.memory.keys())) {
      if (k.startsWith(NAMESPACE)) {
        this.memory.delete(k);
      }
    }
  }
}

/** Shared singleton — import this in app code. */
export const storageService = new StorageService();
