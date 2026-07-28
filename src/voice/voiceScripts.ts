import type { SoundCue, VoiceEvent, VoiceSettings } from './types';

type ScriptKey = 'training-ready' | 'ready' | 'contract' | 'hold' | 'relax' | 'rest' | 'feedback' | 'paused' | 'resumed' | 'completed' | 'stopped';

const coachScripts: Record<VoiceSettings['language'], Record<ScriptKey, string>> = {
  'zh-CN': {
    'training-ready': '准备开始训练',
    ready: '准备开始',
    contract: '开始收缩',
    hold: '保持住',
    relax: '慢慢放松',
    rest: '休息一下',
    feedback: '训练完成',
    paused: '训练已暂停',
    resumed: '继续训练',
    completed: '训练完成，做得很好',
    stopped: '训练已结束',
  },
  'en-US': {
    'training-ready': 'Ready to begin',
    ready: 'Get ready',
    contract: 'Start contracting',
    hold: 'Hold',
    relax: 'Slowly release',
    rest: 'Rest a moment',
    feedback: 'Training complete',
    paused: 'Training paused',
    resumed: 'Continue training',
    completed: 'Great work, training complete',
    stopped: 'Training ended',
  },
};

export function resolveSpeech(event: VoiceEvent, settings: VoiceSettings): string | null {
  if (!settings.enabled || settings.mode !== 'coach') return null;

  if (event.type === 'countdown') {
    return settings.countdownFrom > 0 ? String(event.seconds) : null;
  }

  if (event.type === 'round-start') {
    if (!settings.announceRound) return null;
    return settings.language === 'zh-CN'
      ? `第 ${event.round} 次，共 ${event.totalRounds} 次`
      : `Repetition ${event.round} of ${event.totalRounds}`;
  }

  const scripts = coachScripts[settings.language];
  if (event.type === 'stage-enter') {
    return event.stage === 'idle' ? null : scripts[event.stage];
  }

  return scripts[event.type];
}

export function resolveCue(event: VoiceEvent): SoundCue | null {
  switch (event.type) {
    case 'training-ready': return 'ready';
    case 'stage-enter':
      if (event.stage === 'contract') return 'contraction-start';
      if (event.stage === 'hold') return 'contraction-sustain';
      if (event.stage === 'relax') return 'release-start';
      return null;
    case 'paused': return 'pause';
    case 'resumed': return 'resume';
    case 'completed': return 'complete';
    case 'stopped': return 'stop';
    default: return null;
  }
}
