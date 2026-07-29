import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const recoverySnapshot = {
  status: 'paused',
  phase: 'hold',
  round: 1,
  phaseElapsedMs: 1_000,
  sessionElapsedMs: 8_000,
  totalPausedMs: 0,
  config: { contractTime: 3, holdTime: 3, relaxTime: 3, rounds: 10, sets: 1, restBetweenSets: 30 },
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
  await page.waitForLoadState('networkidle');

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

test('main page respects reduced motion and has no serious axe violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });
  await page.goto('.');
  await page.waitForLoadState('networkidle');

  // Verify reduced motion is propagated to DOM
  await expect(page.locator('[data-reduced-motion="true"]')).toBeVisible();

  // Main heading is present
  await expect(page.getByRole('heading', { name: '盆底肌训练' })).toBeVisible();

  // Verify main action buttons are accessible
  await expect(page.getByRole('button', { name: '开始训练' })).toBeVisible();
  const primaryNavigation = page.getByRole('navigation', { name: '主要导航' });
  await expect(primaryNavigation).toBeVisible();
  await expect(primaryNavigation.getByRole('button', { name: '训练', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(primaryNavigation.getByRole('button', { name: '记录', exact: true })).toBeVisible();
  await expect(primaryNavigation.getByRole('button', { name: '设置', exact: true })).toBeVisible();

  await page.getByRole('button', { name: '编辑当前训练计划' }).click();
  const planDialog = page.getByRole('dialog', { name: '调整训练计划' });
  const sheetAnimationDuration = await planDialog.evaluate(
    (element) => getComputedStyle(element).animationDuration,
  );
  expect(Number.parseFloat(sheetAnimationDuration || '0')).toBeLessThanOrEqual(0.001);
  await page.getByRole('button', { name: '关闭训练计划' }).click();

  await expectNoSeriousAxeViolations(page);
});

test('settings and plan drawer remain usable at 320px with 200% text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });
  await page.goto('.');
  await page.waitForLoadState('networkidle');
  await page.locator('html').evaluate((element) => {
    element.style.fontSize = '200%';
  });

  const shell = page.locator('.app-shell');
  const navigation = page.getByRole('navigation', { name: '主要导航' });
  await navigation.getByRole('button', { name: '设置', exact: true }).click();
  await expect.poll(() => shell.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

  await page.getByRole('button', { name: /训练计划/ }).click();
  const dialog = page.getByRole('dialog', { name: '调整训练计划' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveClass(/bottom-sheet/);

  for (const name of ['关闭训练计划', '增加收缩', '应用此计划']) {
    const box = await page.getByRole('button', { name }).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  }
  await expect.poll(() => dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await expectNoSeriousAxeViolations(page);
});

test('primary pages stay reachable on regular phone and landscape viewports', async ({ page }) => {
  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('.');
    await page.waitForLoadState('networkidle');
    const shell = page.locator('.app-shell');
    const navigation = page.getByRole('navigation', { name: '主要导航' });

    await expect(page.getByRole('button', { name: '开始训练' })).toBeVisible();
    await navigation.getByRole('button', { name: '记录', exact: true }).click();
    await expect(page.getByRole('heading', { name: '训练记录' })).toBeVisible();
    await navigation.getByRole('button', { name: '设置', exact: true }).click();
    await expect(page.getByRole('heading', { name: '设置' })).toBeVisible();
    await expect.poll(() => shell.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
});

test('bottom navigation owns the safe area once and stays visually compact', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });
  await page.goto('.');
  await page.waitForLoadState('networkidle');
  await page.locator('html').evaluate((element) => {
    element.style.setProperty('--safe-area-bottom', '24px');
  });

  const navigation = page.getByRole('navigation', { name: '主要导航' });
  const navigationContent = navigation.locator('.primary-navigation-content');
  const actionDock = page.locator('.bottom-action-dock');
  const startButton = page.getByRole('button', { name: '开始训练' });

  await expect(navigation).toBeVisible();
  await expect(navigation.locator('svg')).toHaveCount(3);
  await expect(navigationContent).toHaveCSS('height', '56px');
  await expect(navigation).toHaveCSS('height', '80px');
  await expect(actionDock).not.toHaveClass(/pb-\[var\(--safe-area-bottom\)\]/);

  const [buttonBox, navigationBox] = await Promise.all([
    startButton.boundingBox(),
    navigation.boundingBox(),
  ]);
  expect(buttonBox).not.toBeNull();
  expect(navigationBox).not.toBeNull();
  expect(Math.round(navigationBox!.y - (buttonBox!.y + buttonBox!.height))).toBe(16);

  await startButton.click();
  await expect(navigation).toBeHidden();
  await expect(actionDock).toHaveClass(/pb-\[var\(--safe-area-bottom\)\]/);
});
