import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_VOICE_SETTINGS } from '../voice/voiceSettings';
import VoiceDrawer from './VoiceDrawer';

function openDetails(text: string) {
  const details = screen.getByText(text).closest('details');
  if (details) details.open = true;
}

function renderDrawer() {
  const onChange = vi.fn();
  const onClose = vi.fn();
  const onPreview = vi.fn().mockResolvedValue(true);
  const { container } = render(
    <VoiceDrawer
      settings={DEFAULT_VOICE_SETTINGS}
      supported
      hapticsSupported
      onChange={onChange}
      onPreview={onPreview}
      onClose={onClose}
    />,
  );
  return { container, onChange, onClose, onPreview };
}

describe('VoiceDrawer draft flow', () => {
  it('keeps edits local until the user applies the settings', () => {
    const { container, onChange, onClose } = renderDrawer();
    openDetails('语音辅助');
    openDetails('高级设置');
    const volume = container.querySelector<HTMLInputElement>('#voice-volume')!;

    fireEvent.change(volume, { target: { value: '0.5' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '应用设置' }));

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_VOICE_SETTINGS, volume: 0.5 });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('previews the draft without committing it', () => {
    const { container, onChange, onPreview } = renderDrawer();
    openDetails('语音辅助');
    openDetails('高级设置');
    fireEvent.change(container.querySelector<HTMLInputElement>('#voice-volume')!, {
      target: { value: '0.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: '播放测试' }));

    expect(onPreview).toHaveBeenCalledWith({ ...DEFAULT_VOICE_SETTINGS, volume: 0.5 });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('asks before discarding a dirty draft', () => {
    const { container, onChange, onClose } = renderDrawer();
    openDetails('语音辅助');
    openDetails('高级设置');
    fireEvent.change(container.querySelector<HTMLInputElement>('#voice-volume')!, {
      target: { value: '0.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    fireEvent.click(screen.getByRole('button', { name: '放弃修改' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
