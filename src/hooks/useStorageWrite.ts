import { useCallback, useState } from 'react';
import { defaultStorage, type StorageSchema } from '../utils/storage';

export const STORAGE_WRITE_ERROR_MESSAGE = '保存失败，数据可能无法在下次打开时恢复。请释放存储空间后重试。';

export interface StorageWriteResult {
  storageError: string | null;
  dismissStorageError: () => void;
  write: <T>(schema: StorageSchema<T>, value: T) => boolean;
}

export function useStorageWrite(): StorageWriteResult {
  const [storageError, setStorageError] = useState<string | null>(null);
  const dismissStorageError = useCallback(() => setStorageError(null), []);

  const write = useCallback(<T>(schema: StorageSchema<T>, value: T): boolean => {
    const ok = defaultStorage.write(schema, value);
    setStorageError(ok ? null : STORAGE_WRITE_ERROR_MESSAGE);
    return ok;
  }, []);

  return { storageError, dismissStorageError, write };
}
