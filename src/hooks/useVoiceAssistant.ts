import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioFileAdapter } from '../voice/AudioFileAdapter';
import { HapticAdapter } from '../voice/HapticAdapter';
import { PreRecordedAudioAdapter } from '../voice/PreRecordedAudioAdapter';
import { SpeechSynthesisAdapter } from '../voice/SpeechSynthesisAdapter';
import {
  VoiceController,
  type VoiceEventContext,
} from '../voice/VoiceController';
import type { VoiceEvent, VoiceSettings } from '../voice/types';
import {
  loadVoiceSettings,
  saveVoiceSettings,
  validateVoiceSettings,
} from '../voice/voiceSettings';

export interface UseVoiceAssistantReturn {
  settings: VoiceSettings;
  supported: boolean;
  hapticsSupported: boolean;
  storageError: string | null;
  dismissStorageError: () => void;
  emit: (event: VoiceEvent, context: VoiceEventContext) => void;
  updateSettings: (updates: Partial<VoiceSettings>) => void;
  unlock: () => Promise<void>;
  preview: (previewSettings?: VoiceSettings) => Promise<boolean>;
}

export function useVoiceAssistant(): UseVoiceAssistantReturn {
  const [settings, setSettings] = useState(loadVoiceSettings);
  const [storageError, setStorageError] = useState<string | null>(null);
  const controllerRef = useRef<VoiceController | null>(null);
  const hapticRef = useRef<HapticAdapter | null>(null);

  if (!controllerRef.current) {
    const haptics = new HapticAdapter();
    hapticRef.current = haptics;
    controllerRef.current = new VoiceController(
      new SpeechSynthesisAdapter(),
      new AudioFileAdapter(),
      new PreRecordedAudioAdapter(),
      haptics,
      settings,
    );
  }

  useEffect(() => {
    const controller = controllerRef.current;
    controller?.updateSettings(settings);
    const ok = saveVoiceSettings(settings);
    setStorageError(ok ? null : '语音设置保存失败，下次打开可能需要重新设置。');
  }, [settings]);

  useEffect(() => () => controllerRef.current?.stop(), []);

  const emit = useCallback((event: VoiceEvent, context: VoiceEventContext) => {
    const controller = controllerRef.current;
    if (!controller) return;
    controller.enqueue(event, context);
    void controller.flush().catch((err: unknown) => { console.warn('[VoiceAssistant] flush failed:', err); });
  }, []);

  const updateSettings = useCallback((updates: Partial<VoiceSettings>) => {
    setSettings(current => validateVoiceSettings({ ...current, ...updates }));
  }, []);

  const unlock = useCallback(async () => {
    await controllerRef.current?.preload();
  }, []);

  const preview = useCallback(async (previewSettings?: VoiceSettings) => {
    const controller = controllerRef.current;
    if (!controller) return false;
    if (previewSettings) controller.updateSettings(previewSettings);
    try {
      return await controller.preview();
    } finally {
      if (previewSettings) controller.updateSettings(settings);
    }
  }, [settings]);

  return {
    settings,
    supported: controllerRef.current.isSupported(),
    hapticsSupported: hapticRef.current?.isSupported() ?? false,
    storageError,
    dismissStorageError: () => setStorageError(null),
    emit,
    updateSettings,
    unlock,
    preview,
  };
}
