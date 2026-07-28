/**
 * Unified local-storage adapter with schema validation, versioned keys,
 * corruption recovery, and clear strategies.
 *
 * Key format: kegel.{category}.v{version}
 *
 * Each data category defines a StorageSchema that declares its current version,
 * default value, validation/migration function, and optional upgrade chain for
 * transparently reading older key versions.
 *
 * All read/write/clear operations catch storage errors (quota, private browsing,
 * corrupted data) silently and return defaults or no-ops.
 */

/** Minimum storage interface needed; accepts the global `localStorage` or a
 *  test double that implements a subset of the Storage API. */
export interface MinimalStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  readonly length: number;
}

/** Configuration object that describes one category of persisted data. */
export interface StorageSchema<T> {
  /** Short category name, e.g. 'training-config'.
   *  Produces keys like `kegel.training-config.v1`. */
  category: string;
  /** Current schema version. Increment this when the data shape changes. */
  version: number;
  /** Value to return when no stored data exists. */
  defaultValue: T;
  /**
   * Validate, migrate, and fill defaults for a parsed JSON value.
   * Called after reading from the current-version key.
   * Should never throw — return defaultValue on unrecoverable input.
   */
  validate: (value: unknown) => T;
  /**
   * Ordered chain of upgrades for reading older-version keys.
   * Index 0 migrates data from the next-oldest version (version-1) up one step,
   * and so on. If the chain has N entries it can bridge from version-N to current.
   *
   * Example: version=3, upgrades=[
   *   { fromVersion: 1, migrate: v1→v2 },
   *   { fromVersion: 2, migrate: v2→v3 },
   * ]
   *
   * When reading, the adapter tries keys in order: v3, v2, v1.
   * If it finds data at v1, it runs both migrations to reach v3 shape.
   */
  upgrades?: Array<{
    fromVersion: number;
    migrate: (value: unknown) => unknown;
  }>;
}

/** Return a clean copy of a default value.
 *  Objects and arrays are shallow-copied; primitives are returned as-is. */
function copyDefault<T>(value: T): T {
  if (Array.isArray(value)) return [...value] as T;
  if (value !== null && typeof value === 'object') return { ...value } as T;
  return value;
}

/** Public API returned by createStorageAdapter. */
export interface StorageAdapter {
  read<T>(schema: StorageSchema<T>): T;
  write<T>(schema: StorageSchema<T>, value: T): boolean;
  remove(schema: StorageSchema<unknown>): void;
  /** Remove every localStorage key starting with `kegel.`. */
  clearAll(): void;
  /** True when the underlying storage is readable and writable. */
  isAvailable(): boolean;
}

function storageKey(category: string, version: number): string {
  return `kegel.${category}.v${version}`;
}

/**
 * Walk the upgrade chain in order (oldest first), applying
 * each `migrate` function that has fromVersion < currentVersion.
 */
function applyUpgrades<T>(
  value: unknown,
  fromVersion: number,
  schema: StorageSchema<T>,
): unknown {
  if (!schema.upgrades || schema.upgrades.length === 0) return value;

  // Sort by fromVersion ascending to apply oldest first
  const sorted = [...schema.upgrades].sort(
    (a, b) => a.fromVersion - b.fromVersion,
  );

  let current = value;
  for (const step of sorted) {
    if (step.fromVersion >= fromVersion && step.fromVersion < schema.version) {
      try {
        current = step.migrate(current);
      } catch {
        return schema.defaultValue;
      }
    }
  }
  return current;
}

/**
 * Create a StorageAdapter backed by the given storage object.
 * Pass a test double for unit testing; omit to use globalThis.localStorage.
 */
export function createStorageAdapter(
  storage?: MinimalStorage,
): StorageAdapter {
  const s: MinimalStorage | null | undefined = storage ?? (
    typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? (globalThis as { localStorage?: MinimalStorage }).localStorage
      : undefined
  );

  function checkAvailable(): boolean {
    if (!s) return false;
    try {
      const testKey = '__kegel_storage_test__';
      s.setItem(testKey, '1');
      s.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  return {
    read<T>(schema: StorageSchema<T>): T {
      if (!s) return copyDefault(schema.defaultValue);

      try {
        // 1. Try current-version key
        let raw = s.getItem(storageKey(schema.category, schema.version));
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          return schema.validate(parsed);
        }

        // 2. Walk older versions via upgrade chain
        if (schema.upgrades && schema.upgrades.length > 0) {
          const sorted = [...schema.upgrades].sort(
            (a, b) => a.fromVersion - b.fromVersion,
          );

          for (let i = sorted.length - 1; i >= 0; i--) {
            const step = sorted[i];
            if (step.fromVersion >= schema.version) continue;

            raw = s.getItem(storageKey(schema.category, step.fromVersion));
            if (raw !== null) {
              let parsed = JSON.parse(raw);
              parsed = applyUpgrades(parsed, step.fromVersion, schema);
              const result = schema.validate(parsed);
              // Write back at current version; delete old key
              try {
                s.setItem(
                  storageKey(schema.category, schema.version),
                  JSON.stringify(result),
                );
                s.removeItem(
                  storageKey(schema.category, step.fromVersion),
                );
              } catch { /* best-effort write-back */ }
              return result;
            }
          }
        }

        return copyDefault(schema.defaultValue);
      } catch {
        // JSON parse failure or validate threw — return defaults
        return copyDefault(schema.defaultValue);
      }
    },

    write<T>(schema: StorageSchema<T>, value: T): boolean {
      if (!s) return false;
      try {
        s.setItem(
          storageKey(schema.category, schema.version),
          JSON.stringify(value),
        );
        return true;
      } catch {
        // Quota exceeded, private browsing, or storage unavailable
        return false;
      }
    },

    remove(schema: StorageSchema<unknown>): void {
      if (!s) return;
      try {
        s.removeItem(storageKey(schema.category, schema.version));
      } catch {
        // Ignore
      }
    },

    clearAll(): void {
      if (!s) return;
      try {
        const keys: string[] = [];
        for (let i = 0; i < s.length; i++) {
          const k = s.key(i);
          if (k?.startsWith('kegel.')) keys.push(k);
        }
        keys.forEach((k) => s.removeItem(k));
      } catch {
        // Ignore
      }
    },

    isAvailable(): boolean {
      return checkAvailable();
    },
  };
}

/** Singleton adapter backed by real localStorage.
 *  Prefer this for production code; use createStorageAdapter(testDouble) in tests. */
export const defaultStorage: StorageAdapter = createStorageAdapter();

/* ── Helper factories ────────────────────────────────────────── */

/** Build a simple schema with no upgrade chain. */
export function defineSchema<T>(opts: Omit<StorageSchema<T>, 'upgrades'>): StorageSchema<T> {
  return { ...opts };
}
