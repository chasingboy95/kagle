import { useRef, useState } from 'react';
import {
  applyDataImport,
  createDataExport,
  CLEAR_ALL_BACKUP_KEY,
  IMPORT_BACKUP_KEY,
  parseDataImport,
  serializeDataExport,
  summarizeDataImport,
  type AppDataExport,
  type ImportStrategy,
} from '../utils/dataTransfer';

interface Props {
  disabled?: boolean;
  onImported?: () => void;
}

const STRATEGIES: Array<{
  id: ImportStrategy;
  label: string;
  description: string;
}> = [
  {
    id: 'replace',
    label: '替换全部',
    description: '使用备份中的设置和训练记录替换本机数据。',
  },
  {
    id: 'merge-history',
    label: '合并训练记录',
    description: '导入设置，并按记录 ID 合并历史，重复记录只保留一条。',
  },
  {
    id: 'settings-only',
    label: '仅导入设置',
    description: '导入训练、语音、周目标和收藏设置，保留本机训练记录。',
  },
];

export default function DataManagement({
  disabled = false,
  onImported = () => window.location.reload(),
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [candidate, setCandidate] = useState<AppDataExport | null>(null);
  const [fileName, setFileName] = useState('');
  const [strategy, setStrategy] = useState<ImportStrategy>('merge-history');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [automaticBackup] = useState(() => {
    try {
      return localStorage.getItem(IMPORT_BACKUP_KEY);
    } catch {
      return null;
    }
  });
  const [clearAllBackup] = useState(() => {
    try {
      return localStorage.getItem(CLEAR_ALL_BACKUP_KEY);
    } catch {
      return null;
    }
  });
  const preview = candidate ? summarizeDataImport(candidate) : null;

  const exportData = () => {
    const data = createDataExport();
    const blob = new Blob([serializeDataExport(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kagle-backup-${data.exportedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const chooseFile = async (file: File | undefined) => {
    setCandidate(null);
    setMessage('');
    setIsError(false);
    if (!file) return;
    setFileName(file.name);
    try {
      setCandidate(parseDataImport(await file.text()));
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : '无法读取该备份。');
    }
  };

  const chooseAutomaticBackup = () => {
    if (!automaticBackup) return;
    try {
      setCandidate(parseDataImport(automaticBackup));
      setFileName('上次导入前自动备份');
      setIsError(false);
      setMessage('');
    } catch {
      setIsError(true);
      setMessage('自动备份已损坏，无法恢复。');
    }
  };

  const chooseClearAllBackup = () => {
    if (!clearAllBackup) return;
    try {
      const parsed = parseDataImport(clearAllBackup);
      setCandidate(parsed);
      const n = parsed.data.trainingHistory.length;
      const time = new Date(parsed.exportedAt).toLocaleString();
      setFileName(`清除前备份 (${n} 条记录, ${time})`);
      setIsError(false);
      setMessage('');
    } catch {
      setIsError(true);
      setMessage('清除前备份已损坏，无法恢复。');
    }
  };

  const importData = () => {
    if (!candidate) return;
    try {
      applyDataImport(candidate, strategy);
      setIsError(false);
      setMessage('导入完成，正在重新加载。');
      onImported();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : '导入未完成。');
    }
  };

  return (
    <section className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03]">
      <div className="space-y-4 px-4 py-4">
        <div>
          <p className="text-xs leading-5 text-slate-500">
            导出设置与训练记录为版本化 JSON 文件，不会上传到云端。
          </p>
          <button
            type="button"
            onClick={exportData}
            disabled={disabled}
            className="mt-2 rounded-lg bg-white/[0.07] px-3 py-2 text-xs font-medium text-slate-200 disabled:opacity-30"
          >
            导出本地数据
          </button>
        </div>

        <div className="border-t border-white/[0.05] pt-3">
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="选择 JSON 备份文件"
            onChange={(event) => void chooseFile(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="rounded-lg bg-white/[0.07] px-3 py-2 text-xs font-medium text-slate-200 disabled:opacity-30"
          >
            选择备份文件
          </button>
          {automaticBackup && (
            <button
              type="button"
              onClick={chooseAutomaticBackup}
              disabled={disabled}
              className="ml-2 rounded-lg bg-white/[0.07] px-3 py-2 text-xs font-medium text-slate-200 disabled:opacity-30"
            >
              恢复上次导入前备份
            </button>
          )}
          {clearAllBackup && (
            <button
              type="button"
              onClick={chooseClearAllBackup}
              disabled={disabled}
              className="ml-2 rounded-lg bg-white/[0.07] px-3 py-2 text-xs font-medium text-slate-200 disabled:opacity-30"
            >
              恢复清除前备份
            </button>
          )}
          {fileName && <span className="ml-2 text-[10px] text-slate-500">{fileName}</span>}
        </div>

        {preview && (
          <section aria-labelledby="import-preview-title" className="space-y-3 rounded-xl bg-white/[0.035] p-3">
            <div>
              <h3 id="import-preview-title" className="text-xs font-medium text-slate-200">
                导入摘要
              </h3>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                <div><dt>备份版本</dt><dd className="text-slate-300">v{preview.schemaVersion}</dd></div>
                <div><dt>导出时间</dt><dd className="text-slate-300">{new Date(preview.exportedAt).toLocaleString()}</dd></div>
                <div><dt>训练配置</dt><dd className="text-slate-300">{preview.trainingSummary}</dd></div>
                <div><dt>配置收藏</dt><dd className="text-slate-300">{preview.savedConfigCount} 个</dd></div>
                <div><dt>完成记录</dt><dd className="text-slate-300">{preview.completedCount} 条</dd></div>
                <div><dt>中止记录</dt><dd className="text-slate-300">{preview.stoppedCount} 条</dd></div>
              </dl>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-slate-300">导入方式</legend>
              {STRATEGIES.map((option) => (
                <label key={option.id} className="flex cursor-pointer items-start gap-2">
                  <input
                    type="radio"
                    name="import-strategy"
                    value={option.id}
                    checked={strategy === option.id}
                    onChange={() => setStrategy(option.id)}
                    disabled={disabled}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-xs text-slate-300">{option.label}</span>
                    <span className="block text-[10px] leading-4 text-slate-600">{option.description}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <p className="text-[10px] leading-4 text-slate-500">
              导入前会自动保存本机数据；文件校验失败时不会写入任何内容。
            </p>
            <button
              type="button"
              onClick={importData}
              disabled={disabled}
              className="w-full rounded-lg bg-indigo-500/20 py-2 text-xs font-medium text-indigo-200 disabled:opacity-30"
            >
              确认导入
            </button>
          </section>
        )}

        {message && (
          <p role={isError ? 'alert' : 'status'} className={isError ? 'text-xs text-rose-300' : 'text-xs text-emerald-300'}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
