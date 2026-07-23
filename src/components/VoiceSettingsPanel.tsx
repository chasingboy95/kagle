import type { VoiceMode, VoiceSettings } from '../voice/types';

interface VoiceSettingsPanelProps {
  settings: VoiceSettings;
  supported: boolean;
  onChange: (updates: Partial<VoiceSettings>) => void;
  onPreview: () => void;
}

const modeLabels: Record<VoiceMode, string> = {
  off: '关闭',
  'sound-only': '仅提示音',
  concise: '简洁',
  guided: '引导',
  countdown: '引导与倒计时',
};

function Toggle({ id, label, description, checked, onChange }: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <span>
        <span className="block text-sm text-slate-200">{label}</span>
        {description && <span className="block text-[11px] leading-4 text-slate-500">{description}</span>}
      </span>
      <span className="relative shrink-0">
        <input id={id} type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="peer sr-only" />
        <span className="block h-6 w-11 rounded-full bg-slate-700 transition-colors peer-checked:bg-indigo-500 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-slate-900" />
        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export default function VoiceSettingsPanel({ settings, supported, onChange, onPreview }: VoiceSettingsPanelProps) {
  const speechMode = settings.mode !== 'off' && settings.mode !== 'sound-only';
  const disabled = !settings.enabled;

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
        <Toggle id="voice-enabled" label="启用语音辅助" checked={settings.enabled} onChange={enabled => onChange({ enabled })} />
        <div className="h-px bg-white/[0.04]" />

        <label htmlFor="voice-mode" className="flex items-center justify-between gap-4 py-2.5 text-sm text-slate-300">
          模式
          <select
            id="voice-mode"
            value={settings.mode}
            disabled={disabled}
            onChange={event => onChange({ mode: event.target.value as VoiceMode })}
            className="max-w-44 rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:opacity-40"
          >
            {Object.entries(modeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>

        <fieldset className="py-2 disabled:opacity-40" disabled={disabled || settings.mode !== 'countdown'}>
          <legend className="mb-2 text-sm text-slate-300">倒计时</legend>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/20 p-1">
            {([[0, '关闭'], [3, '最后 3 秒'], [5, '最后 5 秒']] as const).map(([value, label]) => (
              <label key={value} className="cursor-pointer">
                <input type="radio" name="voice-countdown" value={value} checked={settings.countdownFrom === value} onChange={() => onChange({ countdownFrom: value })} className="peer sr-only" />
                <span className="block rounded-lg px-2 py-2 text-center text-xs text-slate-500 transition-colors peer-checked:bg-white/10 peer-checked:text-slate-100 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-300">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label htmlFor="voice-volume" className="block py-2 text-sm text-slate-300">
          <span className="flex justify-between"><span>音量</span><span className="tabular-nums text-slate-500">{Math.round(settings.volume * 100)}%</span></span>
          <input id="voice-volume" type="range" min="0" max="1" step="0.05" value={settings.volume} disabled={disabled} onChange={event => onChange({ volume: Number(event.target.value) })} className="mt-2 w-full accent-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:opacity-40" />
        </label>

        <label htmlFor="voice-rate" className="block py-2 text-sm text-slate-300">
          <span className="flex justify-between"><span>语速</span><span className="tabular-nums text-slate-500">{settings.rate.toFixed(2)}×</span></span>
          <input id="voice-rate" type="range" min="0.5" max="1.5" step="0.05" value={settings.rate} disabled={disabled || !speechMode} onChange={event => onChange({ rate: Number(event.target.value) })} className="mt-2 w-full accent-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:opacity-40" />
        </label>

        <Toggle id="voice-rounds" label="播报组数" checked={settings.announceRound} onChange={announceRound => onChange({ announceRound })} />
        <Toggle id="voice-haptics" label="触觉反馈" description="设备支持时使用轻柔振动" checked={settings.hapticsEnabled} onChange={hapticsEnabled => onChange({ hapticsEnabled })} />

        {!supported && speechMode && settings.enabled && (
          <p className="py-2 text-xs leading-5 text-amber-200/70" role="status">当前浏览器不支持语音合成，可选择“仅提示音”。</p>
        )}

        <button
          type="button"
          onClick={onPreview}
          disabled={disabled || settings.mode === 'off' || (speechMode && !supported)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-slate-200 transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-35"
        >
          试听提示
        </button>
      </div>
    </details>
  );
}
