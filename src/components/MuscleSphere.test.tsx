import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MuscleSphere from './MuscleSphere';

// Mock useReducedMotion to control reduced-motion mode in tests
const mockUseReducedMotion = vi.fn().mockReturnValue(false);
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => mockUseReducedMotion(),
  };
});

describe('MuscleSphere', () => {
  it('renders for each stage with correct aria-label', () => {
    const stages = ['idle', 'ready', 'contract', 'hold', 'relax', 'feedback'] as const;
    for (const stage of stages) {
      const { rerender } = render(<MuscleSphere stage={stage} />);
      expect(screen.getByRole('img')).toHaveAttribute(
        'aria-label',
        `Pelvic floor training – ${stage}`,
      );
      rerender(<></>);
    }
  });

  it('renders 9 SVG layer images', () => {
    const { container } = render(<MuscleSphere stage="idle" />);
    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(9);
  });

  it('sets custom size', () => {
    const { container } = render(<MuscleSphere stage="idle" size={200} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.width).toBe('200px');
    expect(wrapper.style.height).toBe('200px');
  });

  it('shows progress ring when showProgressRing is true', () => {
    const { container } = render(
      <MuscleSphere stage="contract" showProgressRing />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.childElementCount).toBeGreaterThanOrEqual(2);
  });

  it('does not render progress ring by default', () => {
    const { container } = render(<MuscleSphere stage="idle" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.childElementCount).toBe(1);
  });

  describe('reduced motion', () => {
    beforeEach(() => {
      mockUseReducedMotion.mockReturnValue(true);
    });

    afterEach(() => {
      mockUseReducedMotion.mockReturnValue(false);
    });

    it('renders without crashing when prefers-reduced-motion is set', () => {
      const stages = ['idle', 'ready', 'contract', 'hold', 'relax', 'feedback'] as const;
      for (const stage of stages) {
        const { rerender } = render(<MuscleSphere stage={stage} />);
        expect(screen.getByRole('img')).toHaveAttribute(
          'aria-label',
          `Pelvic floor training – ${stage}`,
        );
        rerender(<></>);
      }
    });

    it('renders all 9 layers in reduced motion mode', () => {
      const { container } = render(<MuscleSphere stage="idle" />);
      expect(container.querySelectorAll('img')).toHaveLength(9);
    });

    it('still renders progress ring in reduced motion mode', () => {
      const { container } = render(
        <MuscleSphere stage="contract" showProgressRing />,
      );
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.childElementCount).toBeGreaterThanOrEqual(2);
    });
  });
});
