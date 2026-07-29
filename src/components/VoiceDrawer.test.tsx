import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_VOICE_SETTINGS } from '../voice/voiceSettings';
import VoiceDrawer from './VoiceDrawer';

const baseProps = {
  settings: DEFAULT_VOICE_SETTINGS,
  supported: true,
  hapticsSupported: true,
  onPreview: async () => true,
};

describe('VoiceDrawer', () => {
  it('previews the draft without applying it and commits once on apply', async () => {
    const onApply = vi.fn();
    const onPreview = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(
      <VoiceDrawer
        {...baseProps}
        onApply={onApply}
        onPreview={onPreview}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: /节奏提示/ }));
    fireEvent.click(screen.getByRole('button', { name: '播放测试' }));

    expect(onApply).not.toHaveBeenCalled();
    expect(onPreview).toHaveBeenCalledWith({
      ...DEFAULT_VOICE_SETTINGS,
      mode: 'sound-only',
    });

    fireEvent.click(screen.getByRole('button', { name: '应用设置' }));
    expect(onApply).toHaveBeenCalledWith({
      ...DEFAULT_VOICE_SETTINGS,
      mode: 'sound-only',
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not apply a dirty draft when it is discarded', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(<VoiceDrawer {...baseProps} onApply={onApply} onClose={onClose} />);

    fireEvent.click(screen.getByRole('radio', { name: /静音/ }));
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(screen.getByRole('heading', { name: '放弃未应用的修改？' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '放弃修改' }));
    expect(onApply).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
