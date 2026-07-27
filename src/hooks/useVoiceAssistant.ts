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
  emit: (event: VoiceEvent, context: VoiceEventContext) => void;
  updateSettings: (updates: Partial<VoiceSettings>) => void;
  unlock: () => Promise<void>;
}

export function useVoiceAssistant(): UseVoiceAssistantReturn {
  const [settings, setSettings] = useState(loadVoiceSettings);
  const controllerRef = useRef<VoiceController | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new VoiceController(
      new SpeechSynthesisAdapter(),
      new AudioFileAdapter(),
      new PreRecordedAudioAdapter(),
      new HapticAdapter(),
      settings,
    );
  }

  useEffect(() => {
    const controller = controllerRef.current;
    controller?.updateSettings(settings);
    saveVoiceSettings(settings);
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

  return {
    settings,
    supported: controllerRef.current.isSupported(),
    emit,
    updateSettings,
    unlock,
  };
}
