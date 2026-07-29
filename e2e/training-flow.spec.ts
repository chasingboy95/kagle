import { expect, test } from '@playwright/test';

test('plan and voice drawers only commit drafts after explicit apply', async ({ page }) => {
  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
    localStorage.setItem('kegel.training-config.v1', JSON.stringify({
      contractTime: 3,
      holdTime: 3,
      relaxTime: 3,
      rounds: 10,
      sets: 1,
      restBetweenSets: 30,
    }));
  });
  await page.goto('.');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: '调整计划' }).click();
  await page.getByRole('button', { name: '减少每组次数' }).click();
  await page.getByRole('button', { name: '取消' }).click();
  await expect(page.getByRole('alertdialog', { name: '放弃训练计划修改？' })).toBeVisible();
  await page.getByRole('button', { name: '放弃修改' }).click();
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem('kegel.training-config.v1') ?? '{}').rounds,
  )).toBe(10);

  await page.getByRole('button', { name: '调整计划' }).click();
  await page.getByRole('button', { name: '减少每组次数' }).click();
  await page.getByRole('button', { name: '应用此计划' }).click();
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem('kegel.training-config.v1') ?? '{}').rounds,
  )).toBe(9);

  await page.getByRole('button', { name: '声音与震动' }).click();
  await page.getByText('语音辅助').click();
  await page.getByText('启用辅助', { exact: true }).click();
  await page.getByRole('button', { name: '关闭' }).click();
  await expect(page.getByRole('alertdialog', { name: '放弃声音设置修改？' })).toBeVisible();
  await page.getByRole('button', { name: '放弃修改' }).click();

  await page.getByRole('button', { name: '声音与震动' }).click();
  await page.getByText('语音辅助').click();
  await expect(page.locator('#voice-enabled')).toBeChecked();
  await page.getByText('启用辅助', { exact: true }).click();
  await page.getByRole('button', { name: '应用设置' }).click();
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem('kegel.voice-settings.v1') ?? '{}').enabled,
  )).toBe(false);
});

test('history replaces the training home and uses page scrolling on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
    const records = Array.from({ length: 8 }, (_, index) => ({
      id: `mobile-history-${index}`,
      startedAt: new Date(Date.UTC(2026, 6, 28, 10 - index)).toISOString(),
      endedAt: new Date(Date.UTC(2026, 6, 28, 10 - index, 1, 30)).toISOString(),
      contractSec: 3,
      holdSec: 3,
      relaxSec: 3,
      targetReps: 10,
      completedReps: index === 1 ? 4 : 10,
      status: index === 1 ? 'stopped' : 'completed',
      actualDurationMs: index === 1 ? 36_000 : 90_000,
    }));
    localStorage.setItem('kegel.training-history.v1', JSON.stringify(records));
  });
  await page.goto('.');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: '训练记录' }).click();
  await expect(page.getByRole('heading', { name: '训练记录' })).toBeVisible();
  await expect(page.getByText('准备开始')).toBeHidden();
  await expect(page.getByRole('button', { name: '开始训练' })).toBeHidden();
  await expect(page.getByText('10/10次 · 1分30秒').first()).toBeVisible();

  const shell = page.locator('.app-shell');
  await expect.poll(() => shell.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await expect.poll(() => shell.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await shell.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
  await expect(page.getByRole('button', { name: '清除全部' })).toBeVisible();
});

test('completes one configured set and returns to the start screen', async ({ page }) => {
  // Pre-seed localStorage to skip onboarding modal on first visit
  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });
  await page.goto('.');
  await page.waitForLoadState('networkidle');

  // Open config drawer to adjust settings
  await page.getByRole('button', { name: '调整计划' }).click();
  await expect(page.getByRole('dialog', { name: '调整训练计划' })).toBeVisible();

  for (let repetition = 10; repetition > 1; repetition -= 1) {
    await page.getByRole('button', { name: '减少每组次数' }).click();
  }

  // Apply config drawer changes
  await page.getByRole('button', { name: '应用此计划' }).click();

  await page.getByRole('button', { name: '开始训练' }).click();
  await expect(page.getByRole('button', { name: '暂停' })).toBeVisible();

  await page.getByRole('button', { name: '暂停' }).click();
  await expect(page.getByRole('button', { name: '继续' })).toBeVisible();
  await page.getByRole('button', { name: '继续' }).click();

  await expect(page.getByRole('heading', { name: '训练完成' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText('本次完成 1 组（1/1 次）')).toBeVisible();

  await page.getByRole('button', { name: '完成' }).click();
  await expect(page.getByRole('button', { name: '开始训练' })).toBeVisible();
});


test('completes training and views training history from feedback page', async ({ page }) => {
  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });
  await page.goto('.');
  await page.waitForLoadState('networkidle');

  // Open config drawer to adjust settings
  await page.getByRole('button', { name: '调整计划' }).click();
  await expect(page.getByRole('dialog', { name: '调整训练计划' })).toBeVisible();

  for (let repetition = 10; repetition > 1; repetition -= 1) {
    await page.getByRole('button', { name: '减少每组次数' }).click();
  }

  // Apply config drawer changes
  await page.getByRole('button', { name: '应用此计划' }).click();

  await page.getByRole('button', { name: '开始训练' }).click();

  // Wait for training to complete and feedback page
  await expect(page.getByRole('heading', { name: '训练完成' })).toBeVisible({
    timeout: 20_000,
  });

  // Click "查看训练记录"
  await page.getByRole('button', { name: '查看训练记录' }).click();

  // Should now see training history with the just-completed record
  await expect(page.getByRole('heading', { name: '训练记录' })).toBeVisible();
  await expect(page.getByText('1/1次')).toBeVisible();

  // Close history and verify idle state
  await page.getByRole('button', { name: '返回训练' }).click();
  await expect(page.getByRole('button', { name: '开始训练' })).toBeVisible();
});

test('stops training once, clears recovery state, and excludes it from completion stats', async ({ page }) => {
  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });
  await page.goto('.');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: '开始训练' }).click();
  await expect(page.getByRole('button', { name: '结束' })).toBeVisible();
  await page.getByRole('button', { name: '结束' }).click();
  await expect(page.getByRole('button', { name: '开始训练' })).toBeVisible();

  await expect.poll(async () => page.evaluate(() =>
    localStorage.getItem('kegel.session-snapshot.v1'),
  )).toBeNull();

  await page.getByRole('button', { name: '训练记录' }).click();
  await expect(page.getByRole('heading', { name: '训练记录' })).toBeVisible();
  // Use exact regex match to find only the "中止" status badge (not the "已中止" filter button)
  await expect(page.getByText(/^中止$/)).toHaveCount(1);
  await expect(page.getByText(/^0\/10次 · \d+秒$/)).toBeVisible();
  await expect(page.getByText('总次数').locator('..').getByText('0')).toBeVisible();
  await page.getByRole('button', { name: '已完成' }).click();
  await expect(page.getByText('暂无已完成记录')).toBeVisible();
  await page.getByRole('button', { name: '已中止' }).click();
  await expect(page.getByText(/^中止$/)).toHaveCount(1);
  await page.getByRole('button', { name: '返回训练' }).click();
  await expect(page.getByRole('button', { name: '训练记录' })).toBeFocused();
});
