import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_VOICE_SETTINGS } from '../voice/voiceSettings';
import VoiceSettingsPanel from './VoiceSettingsPanel';

/** Open a <details> element by its summary text */
function openDetails(text: string) {
  const el = screen.getByText(text);
  if (el && el.closest) {
    const details = el.closest('details');
    if (details) details.open = true;
  }
}

/** Click a radio input directly by its value attribute */
function clickRadio(container: HTMLElement, value: string | number) {
  const radio = container.querySelector(`input[type="radio"][value="${value}"]`) as HTMLInputElement;
  if (radio) fireEvent.click(radio);
}

/** Find an input by its id attribute (bypass label matching when inside nested details) */
function getInputById(container: HTMLElement, id: string): HTMLInputElement {
  return container.querySelector(`#${id}`) as HTMLInputElement;
}

describe('VoiceSettingsPanel', () => {
  const baseSettings = { ...DEFAULT_VOICE_SETTINGS };
  const preview = async () => true;

  it('renders the panel with correct structure', () => {
    const { container } = render(
      <VoiceSettingsPanel settings={baseSettings} supported hapticsSupported onChange={() => {}} onPreview={preview} />,
    );
    expect(screen.getByText('语音辅助')).toBeInTheDocument();
    expect(getInputById(container, 'voice-enabled')).toBeInTheDocument();
    expect(container.querySelectorAll('input[name="voice-countdown"]')).toHaveLength(3);
  });

  it('toggles enabled state via checkbox', () => {
    const onChange = vi.fn();
    const { container } = render(
      <VoiceSettingsPanel settings={baseSettings} supported hapticsSupported onChange={onChange} onPreview={preview} />,
    );
    fireEvent.click(getInputById(container, 'voice-enabled'));
    expect(onChange).toHaveBeenCalledWith({ enabled: false });
  });

  it('opens main details panel and exposes countdown radios', () => {
    const onChange = vi.fn();
    const { container } = render(
      <VoiceSettingsPanel settings={baseSettings} supported hapticsSupported onChange={onChange} onPreview={preview} />,
    );

    openDetails('语音辅助');

    clickRadio(container, 0);
    expect(onChange).toHaveBeenCalledWith({ countdownFrom: 0 });

    clickRadio(container, 5);
    expect(onChange).toHaveBeenCalledWith({ countdownFrom: 5 });
  });

  it('shows unsupported warning when platform does not support voice', () => {
    render(
      <VoiceSettingsPanel settings={baseSettings} supported={false} hapticsSupported onChange={() => {}} onPreview={preview} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('当前浏览器无法播放录音或系统语音');
  });

  it('hides unsupported warning when supported is true', () => {
    render(
      <VoiceSettingsPanel settings={baseSettings} supported hapticsSupported onChange={() => {}} onPreview={preview} />,
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('hides unsupported warning when not in coach mode even if unsupported', () => {
    render(
      <VoiceSettingsPanel
        settings={{ ...baseSettings, mode: 'sound-only' }}
        supported hapticsSupported={false}
        onChange={() => {}}
        onPreview={preview}
      />,
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('changes voice mode via the advanced mode selector', () => {
    const onChange = vi.fn();
    const { container } = render(
      <VoiceSettingsPanel settings={baseSettings} supported hapticsSupported onChange={onChange} onPreview={preview} />,
    );

    openDetails('语音辅助');
    openDetails('高级设置');

    clickRadio(container, 'off');
    expect(onChange).toHaveBeenCalledWith({ mode: 'off' });
  });

  it('adjusts volume slider in advanced settings', () => {
    const onChange = vi.fn();
    const { container } = render(
      <VoiceSettingsPanel settings={baseSettings} supported hapticsSupported onChange={onChange} onPreview={preview} />,
    );

    openDetails('语音辅助');
    openDetails('高级设置');

    const volume = getInputById(container, 'voice-volume');
    expect(volume).toBeInTheDocument();
    fireEvent.change(volume, { target: { value: '0.5' } });
    expect(onChange).toHaveBeenCalledWith({ volume: 0.5 });
  });

  it('disables volume slider when voice is off', () => {
    const { container } = render(
      <VoiceSettingsPanel
        settings={{ ...baseSettings, mode: 'off' }}
        supported hapticsSupported
        onChange={() => {}}
        onPreview={preview}
      />,
    );

    openDetails('语音辅助');
    openDetails('高级设置');

    expect(getInputById(container, 'voice-volume')).toBeDisabled();
  });

  it('disables rate slider in sound-only mode', () => {
    const { container } = render(
      <VoiceSettingsPanel
        settings={{ ...baseSettings, mode: 'sound-only' }}
        supported hapticsSupported
        onChange={() => {}}
        onPreview={preview}
      />,
    );

    openDetails('语音辅助');
    openDetails('高级设置');

    expect(getInputById(container, 'voice-rate')).toBeDisabled();
  });

  it('disables announce-round toggle in sound-only mode', () => {
    const { container } = render(
      <VoiceSettingsPanel
        settings={{ ...baseSettings, mode: 'sound-only' }}
        supported hapticsSupported
        onChange={() => {}}
        onPreview={preview}
      />,
    );

    openDetails('语音辅助');
    openDetails('高级设置');

    expect(getInputById(container, 'voice-rounds')).toBeDisabled();
  });

  it('shows current mode and countdown before training', () => {
    render(
      <VoiceSettingsPanel settings={baseSettings} supported hapticsSupported onChange={() => {}} onPreview={preview} />,
    );
    expect(screen.getByText(/当前：语音教练 · 最后 3 秒倒计时 · 音量 70%/)).toBeInTheDocument();
    expect(screen.getByText(/浏览器无法判断设备是否静音/)).toBeInTheDocument();
  });

  it('plays a sample and lets the user confirm it was audible', async () => {
    const onPreview = vi.fn().mockResolvedValue(true);
    render(
      <VoiceSettingsPanel settings={baseSettings} supported hapticsSupported onChange={() => {}} onPreview={onPreview} />,
    );

    fireEvent.click(screen.getByRole('button', { name: '播放测试' }));
    await waitFor(() => expect(onPreview).toHaveBeenCalledOnce());
    expect(await screen.findByText('测试样例已播放，请确认是否听到。')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '我能听到' }));
    expect(screen.getByText('声音已确认，可以按当前设置开始训练。')).toBeInTheDocument();
  });

  it('offers a non-technical fallback when preview fails', async () => {
    render(
      <VoiceSettingsPanel
        settings={baseSettings}
        supported
        hapticsSupported
        onChange={() => {}}
        onPreview={async () => false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '播放测试' }));
    expect(await screen.findByText(/没有成功播放。你仍可直接开始训练/)).toBeInTheDocument();
  });

  it('keeps silent without blocking the training controls', () => {
    const onChange = vi.fn();
    render(
      <VoiceSettingsPanel settings={baseSettings} supported hapticsSupported onChange={onChange} onPreview={preview} />,
    );

    fireEvent.click(screen.getByRole('button', { name: '保持静音' }));
    expect(onChange).toHaveBeenCalledWith({ mode: 'off' });
    expect(screen.getByText('已选择静音；你仍可直接开始训练。')).toBeInTheDocument();
  });
});
