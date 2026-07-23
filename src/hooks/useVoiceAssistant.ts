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
  preview: () => Promise<void>;
  unlock: () => Promise<void>;
}

export function useVoiceAssistant(): UseVoiceAssistantReturn {
  const [settings, setSettings] = useState(loadVoiceSettings);
  const controllerRef = useRef<VoiceController | null>(null);
  const previewSequence = useRef(0);

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
    void controller.flush().catch(() => undefined);
  }, []);

  const updateSettings = useCallback((updates: Partial<VoiceSettings>) => {
    setSettings(current => validateVoiceSettings({ ...current, ...updates }));
  }, []);

  const unlock = useCallback(async () => {
    await controllerRef.current?.preload();
  }, []);

  const preview = useCallback(async () => {
    const controller = controllerRef.current;
    if (!controller) return;
    await controller.preload();
    previewSequence.current += 1;
    const now = Date.now();
    controller.enqueue(
      { type: 'training-ready' },
      {
        sessionId: -1,
        round: 0,
        now,
        stageEndsAt: now + 10_000,
        sequence: previewSequence.current,
      },
    );
    await controller.flush(now);
  }, []);

  return {
    settings,
    supported: controllerRef.current.isSupported(),
    emit,
    updateSettings,
    preview,
    unlock,
  };
}
