import { calcTotalDuration } from '../utils/time';
import type { VoiceSettings } from '../voice/types';

interface Props {
  contractTime: number;
  holdTime: number;
  relaxTime: number;
  rounds: number;
  sets: number;
  restBetweenSets: number;
  voice: VoiceSettings;
  onClick?: () => void;
}

function formatDuration(totalMs: number): string {
  const totalSec = Math.ceil(totalMs / 1000);
  if (totalSec < 60) return `${totalSec} 秒`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec > 0 ? `${min} 分 ${sec} 秒` : `${min} 分钟`;
}

export default function PlanSummaryCard({ contractTime, holdTime, relaxTime, rounds, sets, restBetweenSets, voice, onClick }: Props) {
  const totalMs = calcTotalDuration(contractTime, holdTime, relaxTime, rounds, sets, restBetweenSets);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 text-left transition-colors hover:bg-white/[0.07]"
      aria-label="编辑当前训练计划"
    >
      <h2 className="text-sm font-semibold text-slate-200">基础训练</h2>
      <p className="text-xs text-slate-400">
        {contractTime} 秒收缩 · {holdTime} 秒保持 · {relaxTime} 秒放松
      </p>
      <p className="text-xs text-slate-500">
        {sets > 1 ? `${sets} 组 × ${rounds} 次 · 组间休息 ${restBetweenSets} 秒 · ` : ''}约 {formatDuration(totalMs)}
      </p>
      <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-500">
        <span className={voice.enabled && voice.mode !== 'off' ? 'text-emerald-400' : 'text-slate-600'}>
          {voice.enabled && voice.mode !== 'off' ? '语音教练已开启' : '语音已关闭'}
        </span>
        <span className={voice.hapticsEnabled ? 'text-emerald-400' : 'text-slate-600'}>
          {voice.hapticsEnabled ? '震动已开启' : '震动已关闭'}
        </span>
      </div>
    </button>
  );
}
