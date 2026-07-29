import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BottomActionDock from './BottomActionDock';

describe('BottomActionDock', () => {
  it('leaves bottom safe-area ownership to the idle primary navigation', () => {
    const { container, rerender } = render(<BottomActionDock status="idle" idle />);

    expect(container.firstChild).not.toHaveClass('pb-[var(--safe-area-bottom)]');
    expect(screen.getByRole('button', { name: '开始训练' })).toBeVisible();

    rerender(<BottomActionDock status="running" idle={false} />);
    expect(container.firstChild).toHaveClass('pb-[var(--safe-area-bottom)]');
  });
});
