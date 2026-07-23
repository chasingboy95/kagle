import type { SoundCue, VoiceEvent, VoiceSettings } from './types';

type ScriptKey = 'training-ready' | 'contract' | 'hold' | 'relax' | 'paused' | 'resumed' | 'completed' | 'stopped';

const conciseScripts: Record<VoiceSettings['language'], Record<ScriptKey, string>> = {
  'zh-CN': {
    'training-ready': '准备开始',
    contract: '收紧',
    hold: '保持',
    relax: '放松',
    paused: '训练已暂停',
    resumed: '继续训练',
    completed: '训练完成',
    stopped: '训练已结束',
  },
  'en-US': {
    'training-ready': 'Ready to begin',
    contract: 'Contract',
    hold: 'Hold',
    relax: 'Relax',
    paused: 'Training paused',
    resumed: 'Continue training',
    completed: 'Training complete',
    stopped: 'Training ended',
  },
};

const guidedScripts: Record<VoiceSettings['language'], Record<ScriptKey, string>> = {
  'zh-CN': {
    'training-ready': '调整呼吸，准备开始',
    contract: '轻轻收紧盆底肌，并向上提',
    hold: '保持张力，继续自然呼吸',
    relax: '缓慢释放，让肌肉完全放松',
    paused: '训练已暂停',
    resumed: '继续训练',
    completed: '训练完成，保持自然呼吸，让肌肉完全放松',
    stopped: '训练已结束',
  },
  'en-US': {
    'training-ready': 'Settle your breathing and prepare to begin',
    contract: 'Gently contract the pelvic floor and lift',
    hold: 'Maintain the tension and breathe naturally',
    relax: 'Release slowly and let the muscles fully relax',
    paused: 'Training paused',
    resumed: 'Continue training',
    completed: 'Training complete. Breathe naturally and let the muscles fully relax',
    stopped: 'Training ended',
  },
};

function nextStage(stage: Extract<VoiceEvent, { type: 'stage-enter' }>['stage']): string | null {
  if (stage === 'contract') return 'hold';
  if (stage === 'hold') return 'relax';
  if (stage === 'relax') return 'contract';
  return null;
}

export function resolveSpeech(event: VoiceEvent, settings: VoiceSettings): string | null {
  if (!settings.enabled || settings.mode === 'off' || settings.mode === 'sound-only') return null;

  if (event.type === 'countdown') {
    return settings.mode === 'countdown' && settings.countdownFrom > 0
      ? String(event.seconds)
      : null;
  }

  if (event.type === 'round-start') {
    if (!settings.announceRound) return null;
    return settings.language === 'zh-CN'
      ? `第 ${event.round} 组，共 ${event.totalRounds} 组`
      : `Round ${event.round} of ${event.totalRounds}`;
  }

  const scripts = settings.mode === 'concise'
    ? conciseScripts[settings.language]
    : guidedScripts[settings.language];

  if (event.type === 'stage-enter') {
    if (event.stage === 'idle') return null;
    const text = scripts[event.stage];
    const upcoming = nextStage(event.stage);
    if (!settings.announceNextStage || !upcoming) return text;
    const nextText = conciseScripts[settings.language][upcoming as 'contract' | 'hold' | 'relax'];
    return settings.language === 'zh-CN' ? `${text}，接下来${nextText}` : `${text}. Next, ${nextText.toLowerCase()}`;
  }

  return scripts[event.type];
}

export function resolveCue(event: VoiceEvent): SoundCue | null {
  switch (event.type) {
    case 'training-ready': return 'ready';
    case 'stage-enter': return event.stage === 'idle' ? null : event.stage;
    case 'paused': return 'pause';
    case 'resumed': return 'resume';
    case 'completed': return 'complete';
    case 'stopped': return 'stop';
    default: return null;
  }
}
