import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ScheduleSettings from './ScheduleSettings';

const settings = {
  enabled: true,
  daysOfWeek: [1, 3, 5],
  reminderHour: 20,
  reminderMinute: 0,
  lastRemindedDateKey: '',
};

describe('ScheduleSettings', () => {
  it('uses a native time input and updates the time once', () => {
    const onSetReminderTime = vi.fn();
    render(
      <ScheduleSettings
        settings={settings}
        onToggleEnabled={() => undefined}
        onSetDaysOfWeek={() => undefined}
        onSetReminderTime={onSetReminderTime}
      />,
    );

    const input = screen.getByLabelText('提醒时间');
    expect(input).toHaveAttribute('type', 'time');
    fireEvent.change(input, { target: { value: '21:30' } });
    expect(onSetReminderTime).toHaveBeenCalledWith(21, 30);
  });

  it('keeps every weekday target at least 44px and toggles a day', () => {
    const onSetDaysOfWeek = vi.fn();
    render(
      <ScheduleSettings
        settings={settings}
        onToggleEnabled={() => undefined}
        onSetDaysOfWeek={onSetDaysOfWeek}
        onSetReminderTime={() => undefined}
      />,
    );

    const monday = screen.getByText('一').closest('label');
    expect(monday).toHaveClass('min-h-11', 'min-w-11');
    fireEvent.click(screen.getByText('二'));
    expect(onSetDaysOfWeek).toHaveBeenCalledWith([3, 5]);
  });
});
