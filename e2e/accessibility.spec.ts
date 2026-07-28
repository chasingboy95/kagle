import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const recoverySnapshot = {
  status: 'paused',
  phase: 'hold',
  round: 1,
  phaseElapsedMs: 1_000,
  sessionElapsedMs: 8_000,
  totalPausedMs: 0,
  config: { contractTime: 3, holdTime: 3, relaxTime: 3, rounds: 10 },
  announcedCountdowns: [],
  sessionStartedAtIso: '2026-07-28T00:00:00.000Z',
};

async function expectNoSeriousAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(serious).toEqual([]);
}

test('recovery takes priority over onboarding and both modals enforce keyboard rules', async ({ page }) => {
  await page.context().addInitScript((snapshot) => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(true));
    localStorage.setItem('kegel.session-snapshot.v1', JSON.stringify(snapshot));
  }, recoverySnapshot);
  await page.goto('.');

  const recovery = page.getByRole('dialog', { name: '恢复训练' });
  await expect(recovery).toBeVisible();
  await expect(page.getByRole('dialog', { name: '什么是凯格尔训练' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '继续训练' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(recovery).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '放弃' })).toBeFocused();
  await expectNoSeriousAxeViolations(page);

  await page.getByRole('button', { name: '放弃' }).click();
  const onboarding = page.getByRole('dialog', { name: '什么是凯格尔训练' });
  await expect(onboarding).toBeVisible();
  await expect(page.getByRole('button', { name: '下一步' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(onboarding).toHaveCount(0);
});

test('main page exposes live regions and passes axe under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });
  await page.goto('.');

  await expect(page.locator('[data-reduced-motion="true"]')).toBeVisible();
  const politeRegions = page.locator('[aria-live="polite"]');
  await expect(politeRegions.filter({ has: page.getByText('Kegel Training') })).toHaveCount(1);
  await expect(politeRegions.filter({ has: page.getByText('--', { exact: true }) })).toHaveCount(1);
  await expect(
    page.locator('#voice-check-title')
      .locator('..')
      .locator('[aria-live="polite"]'),
  ).toHaveCount(1);
  await expectNoSeriousAxeViolations(page);
});
