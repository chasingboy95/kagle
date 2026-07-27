import { describe, it, expect, beforeEach } from 'vitest';
import { createStorageAdapter, defineSchema, type MinimalStorage, type StorageSchema } from './storage';

function createTestStorage(): MinimalStorage & { _data: Map<string, string> } {
  const _data = new Map<string, string>();
  return {
    _data,
    get length() { return _data.size; },
    getItem(key: string) {
      return _data.has(key) ? _data.get(key)! : null;
    },
    setItem(key: string, value: string) {
      _data.set(key, value);
    },
    removeItem(key: string) {
      _data.delete(key);
    },
    key(index: number) {
      return [..._data.keys()][index] ?? null;
    },
  };
}

interface TestConfig { name: string; count: number; }

function makeConfigSchema(version = 1): StorageSchema<TestConfig> {
  return defineSchema({
    category: 'test-config',
    version,
    defaultValue: { name: 'default', count: 0 },
    validate(value: unknown): TestConfig {
      if (!value || typeof value !== 'object') return { name: 'default', count: 0 };
      const v = value as Record<string, unknown>;
      return {
        name: typeof v.name === 'string' ? v.name : 'default',
        count: typeof v.count === 'number' && Number.isFinite(v.count) ? v.count : 0,
      };
    },
  });
}

describe('createStorageAdapter', () => {
  let storage: ReturnType<typeof createTestStorage>;
  let adapter: ReturnType<typeof createStorageAdapter>;
  let schema: StorageSchema<TestConfig>;
  beforeEach(() => { storage = createTestStorage(); adapter = createStorageAdapter(storage); schema = makeConfigSchema(); });

  it('read returns default when no data exists', () => {
    expect(adapter.read(schema)).toEqual({ name: 'default', count: 0 });
  });
  it('read returns validated data', () => {
    storage.setItem('kegel.test-config.v1', JSON.stringify({ name: 'custom', count: 5 }));
    expect(adapter.read(schema)).toEqual({ name: 'custom', count: 5 });
  });
  it('read fills missing fields with defaults', () => {
    storage.setItem('kegel.test-config.v1', JSON.stringify({}));
    expect(adapter.read(schema)).toEqual({ name: 'default', count: 0 });
  });
  it('read returns default on malformed JSON', () => {
    storage.setItem('kegel.test-config.v1', 'not-json {{{');
    expect(adapter.read(schema)).toEqual({ name: 'default', count: 0 });
  });
  it('read returns default on null value', () => {
    storage.setItem('kegel.test-config.v1', 'null');
    expect(adapter.read(schema)).toEqual({ name: 'default', count: 0 });
  });
  it('read returns default when validate receives wrong type', () => {
    storage.setItem('kegel.test-config.v1', '42');
    expect(adapter.read(schema)).toEqual({ name: 'default', count: 0 });
  });
  it('write and read round-trips', () => {
    adapter.write(schema, { name: 'saved', count: 3 });
    expect(adapter.read(schema)).toEqual({ name: 'saved', count: 3 });
  });
  it('write overwrites previous value', () => {
    adapter.write(schema, { name: 'first', count: 1 });
    adapter.write(schema, { name: 'second', count: 2 });
    expect(adapter.read(schema)).toEqual({ name: 'second', count: 2 });
  });
  it('remove deletes stored data', () => {
    adapter.write(schema, { name: 'to-delete', count: 7 });
    adapter.remove(schema);
    expect(adapter.read(schema)).toEqual({ name: 'default', count: 0 });
  });
  it('remove is no-op when no data exists', () => {
    expect(() => adapter.remove(schema)).not.toThrow();
  });
  it('clearAll removes all kegel.* keys', () => {
    const s2 = defineSchema({ category: 'another', version: 1, defaultValue: 'fallback', validate: (v) => typeof v === 'string' ? v : 'fallback' });
    adapter.write(schema, { name: 'a', count: 1 });
    adapter.write(s2, 'hello');
    storage.setItem('not-kegel', 'keep');
    adapter.clearAll();
    expect(adapter.read(schema)).toEqual({ name: 'default', count: 0 });
    expect(adapter.read(s2)).toBe('fallback');
    expect(storage.getItem('not-kegel')).toBe('keep');
  });
  it('reads old version and migrates to current', () => {
    storage.setItem('kegel.test-config.v1', JSON.stringify({ name: 'old-name' }));
    const v2: StorageSchema<TestConfig> = {
      category: 'test-config', version: 2, defaultValue: { name: 'default', count: 10 },
      validate(value: unknown): TestConfig {
        if (!value || typeof value !== 'object') return { name: 'default', count: 10 };
        const v = value as Record<string, unknown>;
        return { name: typeof v.name === 'string' ? v.name : 'default', count: typeof v.count === 'number' && Number.isFinite(v.count) ? v.count : 10 };
      },
      upgrades: [{ fromVersion: 1, migrate(value: unknown) { const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>; return { name: v.name ?? 'default', count: 10 }; } }],
    };
    const result = adapter.read(v2);
    expect(result).toEqual({ name: 'old-name', count: 10 });
    expect(storage.getItem('kegel.test-config.v2')).toBeTruthy();
  });
  it('skips upgrade when current version key exists', () => {
    storage.setItem('kegel.test-config.v1', JSON.stringify({ name: 'old' }));
    storage.setItem('kegel.test-config.v2', JSON.stringify({ name: 'new', count: 5 }));
    const v2: StorageSchema<TestConfig> = {
      category: 'test-config', version: 2, defaultValue: { name: 'default', count: 0 },
      validate(value: unknown): TestConfig {
        if (!value || typeof value !== 'object') return { name: 'default', count: 0 };
        const v = value as Record<string, unknown>;
        return { name: typeof v.name === 'string' ? v.name : 'default', count: typeof v.count === 'number' && Number.isFinite(v.count) ? v.count : 0 };
      },
      upgrades: [{ fromVersion: 1, migrate: () => ({ name: 'migrated', count: 0 }) }],
    };
    expect(adapter.read(v2)).toEqual({ name: 'new', count: 5 });
  });
  it('returns default when upgrade throws', () => {
    storage.setItem('kegel.test-config.v1', JSON.stringify({ name: 'bad' }));
    const v2: StorageSchema<TestConfig> = {
      category: 'test-config', version: 2, defaultValue: { name: 'safe', count: 0 },
      validate(value: unknown): TestConfig { return (value as TestConfig); },
      upgrades: [{ fromVersion: 1, migrate() { throw new Error('boom'); } }],
    };
    expect(adapter.read(v2)).toEqual({ name: 'safe', count: 0 });
  });
  it('isAvailable returns true for working storage', () => {
    expect(adapter.isAvailable()).toBe(true);
  });
  it('isAvailable returns false when setItem throws', () => {
    const broken: MinimalStorage = { get length() { return 0; }, key() { return null; }, getItem() { return null; }, setItem() { throw new Error('quota'); }, removeItem() {} };
    expect(createStorageAdapter(broken).isAvailable()).toBe(false);
  });
});
