import { motion } from 'framer-motion';
import { CONFIG_RANGE } from '../types/training';
import type { TrainingConfig } from '../types/training';

interface Props {
  config: TrainingConfig;
  disabled: boolean;
  onChange: (updates: Partial<TrainingConfig>) => void;
}

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  disabled: boolean;
  onChange: (v: number) => void;
}

function Stepper({ label, value, min, max, step, unit, disabled, onChange }: StepperProps) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-slate-400 tracking-wide">{label}</span>
      <div className="flex items-center gap-2.5">
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={dec}
          disabled={disabled || value <= min}
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm
            bg-white/[0.07] text-slate-300 disabled:opacity-15
            active:bg-white/[0.12] transition-colors select-none"
          aria-label={`减少${label}`}
        >
          −
        </motion.button>
        <span className="w-9 text-center text-sm font-medium text-slate-200 tabular-nums select-none">
          {value}
        </span>
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={inc}
          disabled={disabled || value >= max}
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm
            bg-white/[0.07] text-slate-300 disabled:opacity-15
            active:bg-white/[0.12] transition-colors select-none"
          aria-label={`增加${label}`}
        >
          +
        </motion.button>
        <span className="text-[10px] text-slate-600 w-4 tracking-wide">{unit}</span>
      </div>
    </div>
  );
}

export default function ConfigPanel({ config, disabled, onChange }: Props) {
  const summary = `${config.contractTime}-${config.holdTime}-${config.relaxTime} × ${config.rounds} 次 = 1 组`;

  return (
    <details className="group w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-300">
        <span>
          <span className="block text-[10px] font-medium tracking-[0.15em] text-slate-500">训练计划</span>
          <span className="mt-0.5 block text-sm text-slate-200 tabular-nums">{summary}</span>
        </span>
        <span aria-hidden="true" className="text-slate-500 transition-transform group-open:rotate-180">⌄</span>
      </summary>

      <div className="space-y-1 border-t border-white/[0.05] px-4 pb-4 pt-2">
        <Stepper
          label="收缩"
          value={config.contractTime}
          min={CONFIG_RANGE.contractTime.min}
          max={CONFIG_RANGE.contractTime.max}
          step={CONFIG_RANGE.contractTime.step}
          unit="秒"
          disabled={disabled}
          onChange={v => onChange({ contractTime: v })}
        />
        <div className="h-px bg-white/[0.04]" />
        <Stepper
          label="保持"
          value={config.holdTime}
          min={CONFIG_RANGE.holdTime.min}
          max={CONFIG_RANGE.holdTime.max}
          step={CONFIG_RANGE.holdTime.step}
          unit="秒"
          disabled={disabled}
          onChange={v => onChange({ holdTime: v })}
        />
        <div className="h-px bg-white/[0.04]" />
        <Stepper
          label="放松"
          value={config.relaxTime}
          min={CONFIG_RANGE.relaxTime.min}
          max={CONFIG_RANGE.relaxTime.max}
          step={CONFIG_RANGE.relaxTime.step}
          unit="秒"
          disabled={disabled}
          onChange={v => onChange({ relaxTime: v })}
        />
        <div className="h-px bg-white/[0.04]" />
        <Stepper
          label="每组次数"
          value={config.rounds}
          min={CONFIG_RANGE.rounds.min}
          max={CONFIG_RANGE.rounds.max}
          step={CONFIG_RANGE.rounds.step}
          unit="次"
          disabled={disabled}
          onChange={v => onChange({ rounds: v })}
        />
        <p className="pt-1 text-right text-[10px] leading-4 text-slate-600">
          完成以上次数计为 1 组
        </p>
      </div>
    </details>
  );
}
