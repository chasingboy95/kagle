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
  if (
    !settings.enabled
    || settings.language !== 'zh-CN'
    || settings.mode !== 'coach'
  ) return null;

  if (event.type === 'round-start' || event.type === 'countdown') return null;
  if (event.type === 'paused') return audioUrl('zh-CN/paused.mp3', baseUrl);
  if (event.type === 'resumed') return audioUrl('zh-CN/resumed.mp3', baseUrl);
  if (event.type === 'stopped') return audioUrl('voice/common/stopped.mp3', baseUrl);
  if (event.type === 'training-ready') return audioUrl('zh-CN/ready.mp3', baseUrl);
  // completed 使用 TTS 播报，避免 mp3 阻塞 drain

  if (event.type === 'stage-enter') {
    switch (event.stage) {
      case 'contract':
        return audioUrl('zh-CN/contraction-start.mp3', baseUrl);
      case 'hold':
        return audioUrl('zh-CN/contraction-sustain.mp3', baseUrl);
      case 'relax':
        return audioUrl('zh-CN/release-start.mp3', baseUrl);
      default:
        return null;
    }
  }

  return null;
}
