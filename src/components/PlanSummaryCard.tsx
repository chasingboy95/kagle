import { calcTotalDuration } from '../utils/time';
import type { VoiceSettings } from '../voice/types';

interface Props {
  contractTime: number;
  holdTime: number;
  relaxTime: number;
  rounds: number;
  voice: VoiceSettings;
}

function formatDuration(totalMs: number): string {
  const totalSec = Math.ceil(totalMs / 1000);
  if (totalSec < 60) return `${totalSec} 秒`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec > 0 ? `${min} 分 ${sec} 秒` : `${min} 分钟`;
}

export default function PlanSummaryCard({ contractTime, holdTime, relaxTime, rounds, voice }: Props) {
  const totalMs = calcTotalDuration(contractTime, holdTime, relaxTime, rounds);

  return (
    <div className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 space-y-2">
      <h2 className="text-sm font-semibold text-slate-200">基础训练</h2>
      <p className="text-xs text-slate-400">
        {contractTime} 秒收缩 · {holdTime} 秒保持 · {relaxTime} 秒放松
      </p>
      <p className="text-xs text-slate-500">
        {rounds} 次 · 约 {formatDuration(totalMs)}
      </p>
      <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-500">
        <span className={voice.enabled && voice.mode !== 'off' ? 'text-emerald-400' : 'text-slate-600'}>
          {voice.enabled && voice.mode !== 'off' ? '语音教练已开启' : '语音已关闭'}
        </span>
        <span className={voice.hapticsEnabled ? 'text-emerald-400' : 'text-slate-600'}>
          {voice.hapticsEnabled ? '震动已开启' : '震动已关闭'}
        </span>
      </div>
    </div>
  );
}
