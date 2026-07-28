import { beforeEach, describe, expect, it } from 'vitest';
import { createStorageAdapter } from './storage';
import {
  DEFAULT_WEEKLY_GOAL,
  ONBOARDING_SCHEMA,
  PROGRESSIVE_SCHEMA,
  SAVED_CONFIGS_SCHEMA,
  WEEKLY_GOAL_SCHEMA,
} from './appStorageSchemas';
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

  it('validates weekly targets and keeps the versioned default', () => {
    expect(WEEKLY_GOAL_SCHEMA).toMatchObject({
      category: 'weekly-goal',
      version: 2,
      defaultValue: DEFAULT_WEEKLY_GOAL,
    });
    expect(WEEKLY_GOAL_SCHEMA.validate({ enabled: true, targetDays: 9 })).toEqual({
      enabled: true,
      targetDays: 7,
    });
    expect(WEEKLY_GOAL_SCHEMA.validate({ enabled: 'yes', targetDays: 2.5 })).toEqual(
      DEFAULT_WEEKLY_GOAL,
    );
  });

  it('migrates a numeric v1 weekly target to the current settings object', () => {
    localStorage.setItem('kegel.weekly-goal.v1', JSON.stringify(4));
    expect(createStorageAdapter().read(WEEKLY_GOAL_SCHEMA)).toEqual({
      enabled: true,
      targetDays: 4,
    });
    expect(localStorage.getItem('kegel.weekly-goal.v1')).toBeNull();
    expect(localStorage.getItem('kegel.weekly-goal.v2')).toBe(
      JSON.stringify({ enabled: true, targetDays: 4 }),
    );
  });

  it('keeps valid saved configurations and drops invalid or duplicate entries', () => {
    const valid = {
      id: 'morning',
      name: '  早晨  ',
      config: { contractTime: 3, holdTime: 4, relaxTime: 5, rounds: 8 },
    };
    expect(SAVED_CONFIGS_SCHEMA.validate([
      valid,
      { ...valid, name: '重复 ID' },
      { id: 'fraction', name: '小数', config: { ...valid.config, rounds: 2.5 } },
      { id: 'range', name: '越界', config: { ...valid.config, holdTime: 31 } },
      { id: 'nan', name: '非有限', config: { ...valid.config, relaxTime: NaN } },
    ])).toEqual([{
      ...valid,
      name: '早晨',
    }]);
  });

  it('limits saved configurations to five', () => {
    const values = Array.from({ length: 7 }, (_, index) => ({
      id: `config-${index}`,
      name: `配置 ${index}`,
      config: { contractTime: 3, holdTime: 3, relaxTime: 3, rounds: 10 },
    }));
    expect(SAVED_CONFIGS_SCHEMA.validate(values)).toHaveLength(5);
  });

  it('migrates flat v1 saved configurations to the nested v2 shape', () => {
    localStorage.setItem('kegel.saved-configs.v1', JSON.stringify([{
      id: 'legacy',
      name: '旧收藏',
      contractTime: 5,
      holdTime: 8,
      relaxTime: 5,
      rounds: 10,
    }]));

    expect(createStorageAdapter().read(SAVED_CONFIGS_SCHEMA)).toEqual([{
      id: 'legacy',
      name: '旧收藏',
      config: { contractTime: 5, holdTime: 8, relaxTime: 5, rounds: 10 },
    }]);
    expect(localStorage.getItem('kegel.saved-configs.v1')).toBeNull();
    expect(localStorage.getItem('kegel.saved-configs.v2')).not.toBeNull();
  });
});
