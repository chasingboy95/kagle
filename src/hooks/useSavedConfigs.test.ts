import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../types/training';
import { useSavedConfigs } from './useSavedConfigs';

describe('useSavedConfigs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves, renames, deletes, and persists a copied configuration', () => {
    const { result } = renderHook(() => useSavedConfigs());
    const config = { ...DEFAULT_CONFIG, holdTime: 7 };

    act(() => {
      expect(result.current.add('  晚间训练  ', config)).toBe(true);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      name: '晚间训练',
      config,
    });
    expect(result.current.items[0].config).not.toBe(config);
    expect(localStorage.getItem('kegel.saved-configs.v2')).toContain('晚间训练');

    const id = result.current.items[0].id;
    act(() => {
      expect(result.current.rename(id, '睡前')).toBe(true);
    });
    expect(result.current.items[0].name).toBe('睡前');

    act(() => result.current.remove(id));
    expect(result.current.items).toEqual([]);
    expect(localStorage.getItem('kegel.saved-configs.v2')).toBe('[]');
  });

  it('rejects empty names and stops at five favorites', () => {
    const { result } = renderHook(() => useSavedConfigs());
    act(() => {
      expect(result.current.add('   ', DEFAULT_CONFIG)).toBe(false);
      for (let index = 1; index <= 5; index += 1) {
        expect(result.current.add(`配置 ${index}`, DEFAULT_CONFIG)).toBe(true);
      }
    });

    expect(result.current.items).toHaveLength(5);
    expect(result.current.atLimit).toBe(true);
    act(() => {
      expect(result.current.add('第六个', DEFAULT_CONFIG)).toBe(false);
    });
    expect(result.current.items).toHaveLength(5);
  });
});
