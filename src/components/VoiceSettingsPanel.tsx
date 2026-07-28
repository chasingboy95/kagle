import { useState } from 'react';
import type { VoiceMode, VoiceSettings } from '../voice/types';

interface VoiceSettingsPanelProps {
  settings: VoiceSettings;
  supported: boolean;
  onChange: (updates: Partial<VoiceSettings>) => void;
  onPreview: () => Promise<boolean>;
}

const modeLabels: Record<VoiceMode, string> = {
  off: '静音',
  'sound-only': '节奏提示',
  coach: '语音教练',
};

const modeDescriptions: Record<VoiceMode, string> = {
  off: '不播放语音或提示音，可保留震动反馈',
  'sound-only': '使用不同节奏提示动作切换，不播报完整句子',
  coach: '使用真人录音引导收缩、保持和放松',
};

function Toggle({ id, label, description, checked, disabled = false, onChange }: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className={`flex items-center justify-between gap-4 py-2 ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}>
      <span>
        <span className="block text-sm text-slate-200">{label}</span>
        {description && <span className="block text-[11px] leading-4 text-slate-500">{description}</span>}
      </span>
      <span className="relative shrink-0">
        <input id={id} type="checkbox" disabled={disabled} checked={checked} onChange={event => onChange(event.target.checked)} className="peer sr-only" />
        <span className="block h-6 w-11 rounded-full bg-slate-700 transition-colors peer-checked:bg-indigo-500 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-900" />
        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

type CheckState = 'idle' | 'playing' | 'ready' | 'heard' | 'muted' | 'failed';

const countdownLabels: Record<VoiceSettings['countdownFrom'], string> = {
  0: '倒计时关闭',
  3: '最后 3 秒倒计时',
  5: '最后 5 秒倒计时',
};

export default function VoiceSettingsPanel({
  settings,
  supported,
  onChange,
  onPreview,
}: VoiceSettingsPanelProps) {
  const disabled = !settings.enabled;
  const audible = settings.mode !== 'off';
  const coachMode = settings.mode === 'coach';
  const [checkState, setCheckState] = useState<CheckState>('idle');

  const runPreview = async () => {
    setCheckState('playing');
    setCheckState(await onPreview() ? 'ready' : 'failed');
  };

  const keepMuted = () => {
    onChange({ mode: 'off' });
    setCheckState('muted');
  };

  return (
    <details className="group w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-300">
        <span>
          <span className="block text-[10px] font-medium tracking-[0.15em] text-slate-500">语音辅助</span>
          <span className="mt-0.5 block text-sm text-slate-200">{settings.enabled ? modeLabels[settings.mode] : '已关闭'}</span>
        </span>
        <span aria-hidden="true" className="text-slate-500 transition-transform group-open:rotate-180">⌄</span>
      </summary>

      <div className="border-t border-white/[0.05] px-4 pb-4 pt-2">
        <Toggle id="voice-enabled" label="启用辅助" checked={settings.enabled} onChange={enabled => onChange({ enabled })} />
        <div className="h-px bg-white/[0.04]" />

        <section aria-labelledby="voice-check-title" className="my-3 rounded-xl border border-white/[0.06] bg-black/10 p-3">
          <h3 id="voice-check-title" className="text-sm font-medium text-slate-200">训练前声音自检</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            当前：{settings.enabled ? modeLabels[settings.mode] : '已关闭'} · {countdownLabels[settings.countdownFrom]} · 音量 {Math.round(settings.volume * 100)}%
          </p>
          <p className="mt-1 text-[11px] leading-4 text-slate-500">
            浏览器无法判断设备是否静音，请以实际听感确认。自检可跳过，不影响直接开始训练。
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={disabled || !audible || checkState === 'playing'}
              onClick={() => { void runPreview(); }}
              className="rounded-lg bg-indigo-500/20 px-2 py-2 text-xs font-medium text-indigo-100 transition-colors hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {checkState === 'playing' ? '播放中…' : '播放测试'}
            </button>
            <button
              type="button"
              disabled={checkState !== 'ready'}
              onClick={() => setCheckState('heard')}
              className="rounded-lg bg-emerald-500/15 px-2 py-2 text-xs font-medium text-emerald-100 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              我能听到
            </button>
            <button
              type="button"
              onClick={keepMuted}
              className="rounded-lg bg-white/[0.06] px-2 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10"
            >
              保持静音
            </button>
          </div>
          <div aria-live="polite" className="mt-2 min-h-5 text-xs leading-5 text-slate-400">
            {checkState === 'ready' && '测试样例已播放，请确认是否听到。'}
            {checkState === 'heard' && '声音已确认，可以按当前设置开始训练。'}
            {checkState === 'muted' && '已选择静音；你仍可直接开始训练。'}
            {checkState === 'failed' && '没有成功播放。你仍可直接开始训练，也可改用“节奏提示”或保持静音。'}
          </div>
        </section>

        <fieldset className="py-2 disabled:opacity-40" disabled={disabled || !audible}>
          <legend className="mb-2 text-sm text-slate-300">结束前倒计时</legend>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/20 p-1">
            {([[0, '关闭'], [3, '最后 3 秒'], [5, '最后 5 秒']] as const).map(([value, label]) => (
              <label key={value} className="cursor-pointer">
                <input type="radio" name="voice-countdown" value={value} checked={settings.countdownFrom === value} onChange={() => onChange({ countdownFrom: value })} className="peer sr-only" />
                <span className="block rounded-lg px-2 py-2 text-center text-xs text-slate-500 transition-colors peer-checked:bg-white/10 peer-checked:text-slate-100 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-300">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {!supported && coachMode && settings.enabled && (
          <p className="py-2 text-xs leading-5 text-amber-200/70" role="status">当前浏览器无法播放录音或系统语音，可改用“节奏提示”。</p>
        )}

        <details className="group/advanced mt-3 rounded-xl border border-white/[0.05] bg-black/10">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-300">
            <span>高级设置</span>
            <span aria-hidden="true" className="text-slate-500 transition-transform group-open/advanced:rotate-180">⌄</span>
          </summary>

          <div className="border-t border-white/[0.04] px-3 pb-3 pt-1">
            <fieldset className="py-2.5 disabled:opacity-40" disabled={disabled}>
              <legend className="mb-2 text-sm text-slate-300">辅助方式</legend>
              <div className="space-y-1.5">
                {(Object.keys(modeLabels) as VoiceMode[]).map(mode => (
                  <label key={mode} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2.5 transition-colors has-[:checked]:border-indigo-400/30 has-[:checked]:bg-indigo-400/[0.08]">
                    <input type="radio" name="voice-mode" value={mode} checked={settings.mode === mode} onChange={() => onChange({ mode })} className="mt-1 accent-indigo-400" />
                    <span>
                      <span className="block text-sm text-slate-200">{modeLabels[mode]}</span>
                      <span className="block text-[11px] leading-4 text-slate-500">{modeDescriptions[mode]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label htmlFor="voice-volume" className="block py-2 text-sm text-slate-300">
              <span className="flex justify-between"><span>音量</span><span className="tabular-nums text-slate-500">{Math.round(settings.volume * 100)}%</span></span>
              <input id="voice-volume" type="range" min="0" max="1" step="0.05" value={settings.volume} disabled={disabled || !audible} onChange={event => onChange({ volume: Number(event.target.value) })} className="mt-2 w-full accent-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:opacity-40" />
            </label>

            <label htmlFor="voice-rate" className="block py-2 text-sm text-slate-300">
              <span className="flex justify-between"><span>语速</span><span className="tabular-nums text-slate-500">{settings.rate.toFixed(2)}×</span></span>
              <input id="voice-rate" type="range" min="0.5" max="1.5" step="0.05" value={settings.rate} disabled={disabled || !coachMode} onChange={event => onChange({ rate: Number(event.target.value) })} className="mt-2 w-full accent-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:opacity-40" />
              <span className="mt-1 block text-[11px] leading-4 text-slate-500">真人录音播放时保持原速；录音不可用并回退系统语音时生效。</span>
            </label>

            <Toggle id="voice-rounds" label="播报训练进度" description="每次动作开始时播报当前次数" checked={settings.announceRound} disabled={disabled || !coachMode} onChange={announceRound => onChange({ announceRound })} />
            <Toggle id="voice-haptics" label="震动反馈" description="阶段切换时使用轻柔振动" checked={settings.hapticsEnabled} disabled={disabled} onChange={hapticsEnabled => onChange({ hapticsEnabled })} />
          </div>
        </details>
      </div>
    </details>
  );
}
