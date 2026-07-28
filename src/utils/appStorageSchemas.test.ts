import { beforeEach, describe, expect, it } from 'vitest';
import { createStorageAdapter } from './storage';
import { ONBOARDING_SCHEMA, PROGRESSIVE_SCHEMA } from './appStorageSchemas';
import { DEFAULT_PROGRESSIVE_STATE } from './progressiveTraining';

describe('app storage schemas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps the existing versioned storage keys and defaults', () => {
    expect(PROGRESSIVE_SCHEMA).toMatchObject({
      category: 'progressive-suggestion',
      version: 1,
      defaultValue: DEFAULT_PROGRESSIVE_STATE,
    });
    expect(ONBOARDING_SCHEMA).toMatchObject({
      category: 'onboarding',
      version: 1,
      defaultValue: true,
    });
  });

  it('reads existing progressive-suggestion data through the exported schema', () => {
    localStorage.setItem('kegel.progressive-suggestion.v1', JSON.stringify({
      lastSuggestedAt: '2026-07-28T00:00:00.000Z',
      lastAction: 'ignore',
      ignoreCount: 2,
    }));

    expect(createStorageAdapter().read(PROGRESSIVE_SCHEMA)).toEqual({
      lastSuggestedAt: '2026-07-28T00:00:00.000Z',
      lastAction: 'ignore',
      ignoreCount: 2,
    });
  });

  it('preserves progressive defaults and field-level validation', () => {
    expect(PROGRESSIVE_SCHEMA.validate(null)).toEqual(DEFAULT_PROGRESSIVE_STATE);
    expect(PROGRESSIVE_SCHEMA.validate({
      lastSuggestedAt: 123,
      lastAction: 'invalid',
      ignoreCount: -3.8,
    })).toEqual({
      lastSuggestedAt: '',
      lastAction: null,
      ignoreCount: 0,
    });
  });

  it('reads the existing onboarding key and falls back to true for invalid data', () => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
    expect(createStorageAdapter().read(ONBOARDING_SCHEMA)).toBe(false);
    expect(ONBOARDING_SCHEMA.validate('false')).toBe(true);
  });
});
