import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../types/training';
import { DEFAULT_VOICE_SETTINGS } from '../voice/voiceSettings';
import { DEFAULT_PROGRESSIVE_STATE } from '../utils/progressiveTraining';
import { DEFAULT_WEEKLY_GOAL } from '../utils/appStorageSchemas';
import {
  IMPORT_BACKUP_KEY,
  serializeDataExport,
  type AppDataExport,
} from '../utils/dataTransfer';
import DataManagement from './DataManagement';

const backup: AppDataExport = {
  schemaVersion: 1,
  exportedAt: '2026-07-28T03:00:00.000Z',
  data: {
    trainingConfig: { ...DEFAULT_CONFIG },
    voiceSettings: { ...DEFAULT_VOICE_SETTINGS },
    trainingHistory: [{
      id: 'record',
      startedAt: '2026-07-28T02:59:00.000Z',
      endedAt: '2026-07-28T03:00:00.000Z',
      contractSec: 3,
      holdSec: 3,
      relaxSec: 3,
      targetReps: 10,
      completedReps: 10,
      status: 'completed',
      actualDurationMs: 60_000,
    }],
    progressiveState: { ...DEFAULT_PROGRESSIVE_STATE },
    weeklyGoal: { ...DEFAULT_WEEKLY_GOAL },
    savedConfigs: [],
  },
};

describe('DataManagement', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('validates a selected file and shows its summary and import strategies', async () => {
    render(<DataManagement onImported={() => undefined} />);
    const file = new File([serializeDataExport(backup)], 'backup.json', {
      type: 'application/json',
    });
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve(serializeDataExport(backup)),
    });

    fireEvent.change(screen.getByLabelText('选择 JSON 备份文件'), {
      target: { files: [file] },
    });

    expect(await screen.findByText('导入摘要')).toBeInTheDocument();
    expect(screen.getByText('1 条')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /替换全部/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /合并训练记录/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /仅导入设置/ })).toBeInTheDocument();
    expect(screen.getByText(/自动保存本机数据/)).toBeInTheDocument();
  });

  it('does not offer import for a corrupt file', async () => {
    render(<DataManagement onImported={() => undefined} />);
    const file = new File(['{broken'], 'broken.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve('{broken'),
    });

    fireEvent.change(screen.getByLabelText('选择 JSON 备份文件'), {
      target: { files: [file] },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('无法读取');
    expect(screen.queryByRole('button', { name: '确认导入' })).not.toBeInTheDocument();
  });

  it('applies the selected strategy and invokes the reload callback', async () => {
    const onImported = vi.fn();
    render(<DataManagement onImported={onImported} />);
    const file = new File([serializeDataExport(backup)], 'backup.json', {
      type: 'application/json',
    });
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve(serializeDataExport(backup)),
    });
    fireEvent.change(screen.getByLabelText('选择 JSON 备份文件'), {
      target: { files: [file] },
    });

    await screen.findByText('导入摘要');
    fireEvent.click(screen.getByRole('radio', { name: /仅导入设置/ }));
    fireEvent.click(screen.getByRole('button', { name: '确认导入' }));

    await waitFor(() => expect(onImported).toHaveBeenCalledOnce());
    expect(screen.getByRole('status')).toHaveTextContent('导入完成');
  });

  it('can preview the automatic pre-import backup', async () => {
    localStorage.setItem(IMPORT_BACKUP_KEY, serializeDataExport(backup));
    render(<DataManagement onImported={() => undefined} />);

    fireEvent.click(screen.getByRole('button', { name: '恢复上次导入前备份' }));

    expect(await screen.findByText('导入摘要')).toBeInTheDocument();
    expect(screen.getByText('上次导入前自动备份')).toBeInTheDocument();
  });
});
