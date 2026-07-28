import { useRef, useState } from 'react';
import type { TrainingConfig } from '../types/training';
import {
  MAX_SAVED_CONFIGS,
  SAVED_CONFIGS_SCHEMA,
  type SavedTrainingConfig,
} from '../utils/appStorageSchemas';
import { defaultStorage } from '../utils/storage';

function createSavedConfig(name: string, config: TrainingConfig): SavedTrainingConfig {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    name,
    config: { ...config },
  };
}

export function useSavedConfigs() {
  const initialItems = useRef<SavedTrainingConfig[] | null>(null);
  if (initialItems.current === null) {
    initialItems.current = defaultStorage.read(SAVED_CONFIGS_SCHEMA);
  }
  const itemsRef = useRef(initialItems.current);
  const [items, setItems] = useState<SavedTrainingConfig[]>(initialItems.current);

  const persist = (next: SavedTrainingConfig[]) => {
    const validated = SAVED_CONFIGS_SCHEMA.validate(next);
    itemsRef.current = validated;
    setItems(validated);
    defaultStorage.write(SAVED_CONFIGS_SCHEMA, validated);
  };

  return {
    items,
    atLimit: items.length >= MAX_SAVED_CONFIGS,
    add(name: string, config: TrainingConfig): boolean {
      const trimmedName = name.trim();
      if (
        !trimmedName
        || trimmedName.length > 24
        || itemsRef.current.length >= MAX_SAVED_CONFIGS
      ) {
        return false;
      }
      persist([...itemsRef.current, createSavedConfig(trimmedName, config)]);
      return true;
    },
    rename(id: string, name: string): boolean {
      const trimmedName = name.trim();
      if (
        !trimmedName
        || trimmedName.length > 24
        || !itemsRef.current.some((item) => item.id === id)
      ) {
        return false;
      }
      persist(itemsRef.current.map((item) => (
        item.id === id ? { ...item, name: trimmedName } : item
      )));
      return true;
    },
    remove(id: string) {
      persist(itemsRef.current.filter((item) => item.id !== id));
    },
  };
}
