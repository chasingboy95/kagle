import type { VoiceEvent, VoiceSettings } from './types';

const voiceAssetPaths = [
  'zh-CN/ready.mp3',
  'zh-CN/contraction-start.mp3',
  'zh-CN/contraction-sustain.mp3',
  'zh-CN/release-start.mp3',
  'zh-CN/complete.mp3',
  'zh-CN/paused.mp3',
  'zh-CN/resumed.mp3',
  'voice/common/stopped.mp3',
  'voice/countdown/1.mp3',
  'voice/countdown/2.mp3',
  'voice/countdown/3.mp3',
  'voice/countdown/4.mp3',
  'voice/countdown/5.mp3',
] as const;

function audioUrl(path: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/?$/, '/')}audio/${path}`;
}

export function allVoiceAssetUrls(baseUrl = import.meta.env.BASE_URL): string[] {
  return voiceAssetPaths.map((path) => audioUrl(path, baseUrl));
}

export function resolveVoiceAsset(
  event: VoiceEvent,
  settings: VoiceSettings,
  baseUrl = import.meta.env.BASE_URL,
): string | null {
  if (!settings.enabled || settings.mode === 'off') return null;

  if (event.type === 'countdown') {
    return settings.countdownFrom > 0
      && Number.isInteger(event.seconds)
      && event.seconds >= 1
      && event.seconds <= 5
      ? audioUrl(`voice/countdown/${event.seconds}.mp3`, baseUrl)
      : null;
  }

  if (settings.mode !== 'coach' || settings.language !== 'zh-CN') return null;
  if (event.type === 'round-start') return null;

  if (event.type === 'paused') return audioUrl('zh-CN/paused.mp3', baseUrl);
  if (event.type === 'resumed') return audioUrl('zh-CN/resumed.mp3', baseUrl);
  if (event.type === 'stopped') return audioUrl('voice/common/stopped.mp3', baseUrl);
  if (event.type === 'training-ready') return audioUrl('zh-CN/ready.mp3', baseUrl);
  if (event.type === 'completed') return audioUrl('zh-CN/complete.mp3', baseUrl);

  if (event.type === 'stage-enter') {
    switch (event.stage) {
      case 'contract': return audioUrl('zh-CN/contraction-start.mp3', baseUrl);
      case 'hold': return audioUrl('zh-CN/contraction-sustain.mp3', baseUrl);
      case 'relax': return audioUrl('zh-CN/release-start.mp3', baseUrl);
      default: return null;
    }
  }

  return null;
}
