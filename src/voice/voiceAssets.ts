import type { VoiceEvent, VoiceSettings } from './types';

const voiceAssetPaths = [
  'common/paused.mp3',
  'common/resumed.mp3',
  'common/stopped.mp3',
  'concise/completed.mp3',
  'concise/contract.mp3',
  'concise/hold.mp3',
  'concise/ready.mp3',
  'concise/relax.mp3',
  'countdown/1.mp3',
  'countdown/2.mp3',
  'countdown/3.mp3',
  'countdown/4.mp3',
  'countdown/5.mp3',
  'guided/completed.mp3',
  'guided/contract.mp3',
  'guided/hold.mp3',
  'guided/ready.mp3',
  'guided/relax.mp3',
] as const;

function voiceAssetUrl(path: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/?$/, '/')}audio/voice/${path}`;
}

export function allVoiceAssetUrls(baseUrl = import.meta.env.BASE_URL): string[] {
  return voiceAssetPaths.map((path) => voiceAssetUrl(path, baseUrl));
}

export function resolveVoiceAsset(
  event: VoiceEvent,
  settings: VoiceSettings,
  baseUrl = import.meta.env.BASE_URL,
): string | null {
  if (!settings.enabled || settings.mode === 'off' || settings.mode === 'sound-only') return null;

  if (event.type === 'round-start') return null;
  if (event.type === 'countdown') {
    return settings.mode === 'countdown'
      ? voiceAssetUrl(`countdown/${event.seconds}.mp3`, baseUrl)
      : null;
  }

  if (event.type === 'paused' || event.type === 'resumed' || event.type === 'stopped') {
    return voiceAssetUrl(`common/${event.type}.mp3`, baseUrl);
  }

  const scriptMode = settings.mode === 'concise' ? 'concise' : 'guided';
  if (event.type === 'stage-enter') {
    return event.stage === 'idle'
      ? null
      : voiceAssetUrl(`${scriptMode}/${event.stage}.mp3`, baseUrl);
  }

  const filename = event.type === 'training-ready' ? 'ready' : 'completed';
  return voiceAssetUrl(`${scriptMode}/${filename}.mp3`, baseUrl);
}
