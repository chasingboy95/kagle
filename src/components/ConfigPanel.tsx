import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CONFIG_RANGE, TRAINING_PRESETS, resolvePreset } from '../types/training';
import type { TrainingConfig } from '../types/training';
import type { SavedTrainingConfig } from '../utils/appStorageSchemas';
import SavedConfigs from './SavedConfigs';

interface Props {
  config: TrainingConfig;
  disabled: boolean;
  onChange: (updates: Partial<TrainingConfig>) => void;
  savedConfigs?: SavedTrainingConfig[];
  onSaveConfig?: (name: string, config: TrainingConfig) => boolean;
  onRenameConfig?: (id: string, name: string) => boolean;
  onDeleteConfig?: (id: string) => void;
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
      <span className="text-xs text-warm-400 tracking-wide">{label}</span>
      <div className="flex items-center gap-2.5">
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={dec}
          disabled={disabled || value <= min}
          className="min-h-11 min-w-11 rounded-full flex items-center justify-center text-sm
            bg-warm-200/[0.07] text-warm-200 disabled:opacity-15
            active:bg-warm-200/[0.12] transition-colors select-none"
          aria-label={`减少${label}`}
        >
          −
        </motion.button>
        <span className="w-9 text-center text-sm font-medium text-warm-200 tabular-nums select-none">
          {value}
        </span>
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={inc}
          disabled={disabled || value >= max}
          className="min-h-11 min-w-11 rounded-full flex items-center justify-center text-sm
            bg-warm-200/[0.07] text-warm-200 disabled:opacity-15
            active:bg-warm-200/[0.12] transition-colors select-none"
          aria-label={`增加${label}`}
        >
          +
        </motion.button>
        <span className="text-xs text-warm-500 w-4 tracking-wide">{unit}</span>
      </div>
    </div>
  );
}

export default function ConfigPanel({
  config,
  disabled,
  onChange,
  savedConfigs = [],
  onSaveConfig = () => false,
  onRenameConfig = () => false,
  onDeleteConfig = () => undefined,
}: Props) {
  const [presetId, setPresetId] = useState<string | null>(
    () => resolvePreset(config)?.id ?? null,
  );

  // Sync presetId when parent config changes externally (e.g. progressive suggestion)
  useEffect(() => {
    setPresetId(resolvePreset(config)?.id ?? null);
  }, [config]);

  const summary = `${config.contractTime}-${config.holdTime}-${config.relaxTime} × ${config.rounds} 次 = ${config.sets ?? 1} 组`;

  const handlePresetChange = (id: string) => {
    setPresetId(id);
    const preset = TRAINING_PRESETS.find((p) => p.id === id);
    if (preset) onChange({ ...preset.config });
  };

  const handleParamChange = (field: keyof TrainingConfig) => (value: number) => {
    setPresetId(null);
    onChange({ [field]: value });
  };

  const handleSavedConfig = (savedConfig: TrainingConfig) => {
    setPresetId(resolvePreset(savedConfig)?.id ?? null);
    onChange({ ...savedConfig });
  };

  const activePreset = presetId ? TRAINING_PRESETS.find((p) => p.id === presetId) : null;

  return (
    <section className="w-full">
      <div className="border-b border-warm-200/[0.05] px-4 py-3.5">
        <span>
          <span className="block text-xs font-medium tracking-[0.12em] text-warm-400">
            {activePreset ? activePreset.label : '自定义计划'}
          </span>
          <span className="mt-0.5 block text-sm text-warm-200 tabular-nums">{summary}</span>
        </span>
      </div>

      <div className="space-y-1 px-4 pb-4 pt-2">
        {/* Preset selector */}
        <div className="flex items-center gap-2 py-1.5">
          <span className="text-xs text-warm-400 tracking-wide flex-shrink-0">预设</span>
          <div className="flex gap-1 flex-wrap">
            {TRAINING_PRESETS.map((p) => (
              <motion.button
                key={p.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePresetChange(p.id)}
                disabled={disabled}
                className={`min-h-11 px-3 py-2 rounded-full text-xs font-medium transition-colors select-none
                  ${presetId === p.id
                    ? 'bg-accent/30 text-accent'
                    : 'bg-warm-200/[0.06] text-warm-400 hover:bg-warm-200/[0.10] hover:text-warm-200'
                  }
                  disabled:opacity-20`}
                aria-label={p.label}
              >
                {p.label}
              </motion.button>
            ))}
          </div>
        </div>
        <p className="text-xs text-warm-500 leading-4">
          {activePreset
            ? activePreset.description
            : '自定义节奏模板，不代表医疗建议'}
        </p>

        <div className="h-px bg-warm-200/[0.04] mt-1" />

        <Stepper
          label="收缩"
          value={config.contractTime}
          min={CONFIG_RANGE.contractTime.min}
          max={CONFIG_RANGE.contractTime.max}
          step={CONFIG_RANGE.contractTime.step}
          unit="秒"
          disabled={disabled}
          onChange={handleParamChange('contractTime')}
        />
        <div className="h-px bg-warm-200/[0.04]" />
        <Stepper
          label="保持"
          value={config.holdTime}
          min={CONFIG_RANGE.holdTime.min}
          max={CONFIG_RANGE.holdTime.max}
          step={CONFIG_RANGE.holdTime.step}
          unit="秒"
          disabled={disabled}
          onChange={handleParamChange('holdTime')}
        />
        <div className="h-px bg-warm-200/[0.04]" />
        <Stepper
          label="放松"
          value={config.relaxTime}
          min={CONFIG_RANGE.relaxTime.min}
          max={CONFIG_RANGE.relaxTime.max}
          step={CONFIG_RANGE.relaxTime.step}
          unit="秒"
          disabled={disabled}
          onChange={handleParamChange('relaxTime')}
        />
        <div className="h-px bg-warm-200/[0.04]" />
        <Stepper
          label="每组次数"
          value={config.rounds}
          min={CONFIG_RANGE.rounds.min}
          max={CONFIG_RANGE.rounds.max}
          step={CONFIG_RANGE.rounds.step}
          unit="次"
          disabled={disabled}
          onChange={handleParamChange('rounds')}
        />
        <p className="pt-1 text-right text-xs leading-4 text-warm-500">
          完成以上次数计为 1 组
        </p>
        <div className="h-px bg-warm-200/[0.04]" />
        <Stepper
          label="组数"
          value={config.sets ?? 1}
          min={CONFIG_RANGE.sets.min}
          max={CONFIG_RANGE.sets.max}
          step={CONFIG_RANGE.sets.step}
          unit="组"
          disabled={disabled}
          onChange={handleParamChange('sets')}
        />
        <div className="h-px bg-warm-200/[0.04]" />
        <Stepper
          label="组间休息"
          value={config.restBetweenSets ?? 30}
          min={CONFIG_RANGE.restBetweenSets.min}
          max={CONFIG_RANGE.restBetweenSets.max}
          step={CONFIG_RANGE.restBetweenSets.step}
          unit="秒"
          disabled={disabled}
          onChange={handleParamChange('restBetweenSets')}
        />
        <div className="h-px bg-warm-200/[0.04]" />
        <SavedConfigs
          config={config}
          disabled={disabled}
          items={savedConfigs}
          onApply={handleSavedConfig}
          onSave={onSaveConfig}
          onRename={onRenameConfig}
          onDelete={onDeleteConfig}
        />
      </div>
    </section>
  );
}
