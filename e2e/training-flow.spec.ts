import { expect, test } from '@playwright/test';

test('completes one configured set and returns to the start screen', async ({ page }) => {
  await page.goto('.');

  // Dismiss onboarding modal if present (first visit)
  const skipBtn = page.locator('button:has-text("跳过")');
  if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipBtn.click();
  }

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
    timeout: 15_000,
  });
  await expect(page.getByText('本次完成 1 组（1/1 次）')).toBeVisible();

  await page.getByRole('button', { name: '完成' }).click();
  await expect(page.getByRole('button', { name: '开始训练' })).toBeVisible();
});
