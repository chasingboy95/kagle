import { expect, test } from '@playwright/test';

test('completes one configured set and returns to the start screen', async ({ page }) => {
  // Pre-seed localStorage to skip onboarding modal on first visit
  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });
  await page.goto('.');

  // Expand config panel via the <details> toggle
  await page.locator('details').first().click();

  for (let repetition = 10; repetition > 1; repetition -= 1) {
    await page.getByRole('button', { name: '减少每组次数' }).click();
  }

  await expect(page.getByText('3-3-3 × 1 次 = 1 组')).toBeVisible();
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

  // Configure 1 repetition
  await page.locator('details').first().click();
  for (let repetition = 10; repetition > 1; repetition -= 1) {
    await page.getByRole('button', { name: '减少每组次数' }).click();
  }

  await expect(page.getByText('3-3-3 × 1 次 = 1 组')).toBeVisible();
  await page.getByRole('button', { name: '开始训练' }).click();

  // Wait for training to complete and feedback page
  await expect(page.getByRole('heading', { name: '训练完成' })).toBeVisible({
    timeout: 20_000,
  });

  // Click "查看训练记录"
  await page.getByRole('button', { name: '查看训练记录' }).click();

  // Should now see training history with the just-completed record
  await expect(page.getByText('1/1次')).toBeVisible();

  // Close history and verify idle state
  await page.getByRole('button', { name: '返回' }).click();
  await expect(page.getByRole('button', { name: '开始训练' })).toBeVisible();
});

test('stops training once, clears recovery state, and excludes it from completion stats', async ({ page }) => {
  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });
  await page.goto('.');

  await page.getByRole('button', { name: '开始训练' }).click();
  await expect(page.getByRole('button', { name: '停止' })).toBeVisible();
  await page.getByRole('button', { name: '停止' }).click();
  await expect(page.getByRole('button', { name: '开始训练' })).toBeVisible();

  await expect.poll(async () => page.evaluate(() =>
    localStorage.getItem('kegel.session-snapshot.v1'),
  )).toBeNull();

  await page.getByRole('button', { name: '训练记录' }).click();
  await expect(page.getByText('中止')).toHaveCount(1);
  await expect(page.getByText(/^0\/10次 · \d+秒$/)).toBeVisible();
  await expect(page.getByText('总次数').locator('..').getByText('0')).toBeVisible();
});
