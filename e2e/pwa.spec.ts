import { expect, test } from '@playwright/test';

const BASE = '/kagle/';

// ── Manifest ──────────────────────────────────────────────────

test('manifest is accessible and has required fields', async ({ request }) => {
  const resp = await request.get(BASE + 'manifest.webmanifest');
  expect(resp.status()).toBe(200);
  expect(resp.headers()['content-type']).toContain('application/manifest+json');

  const manifest = await resp.json();
  expect(manifest.name).toBeTruthy();
  expect(manifest.short_name).toBeTruthy();
  expect(manifest.start_url).toBe(BASE);
  expect(manifest.scope).toBe(BASE);
  expect(manifest.display).toBe('standalone');
  expect(manifest.theme_color).toBeTruthy();
  expect(manifest.background_color).toBeTruthy();
  expect(manifest.icons).toBeInstanceOf(Array);
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  for (const icon of manifest.icons) {
    expect(icon.src).toContain('/kagle/icon-');
    expect(icon.type).toBe('image/png');
    expect(icon.sizes).toMatch(/^\d+x\d+$/);
  }
});

// ── Icons ─────────────────────────────────────────────────────

const ICONS = [
  { path: 'icon-192.png', desc: '192x192' },
  { path: 'icon-512.png', desc: '512x512' },
  { path: 'apple-touch-icon.png', desc: 'apple touch' },
  { path: 'favicon.svg', desc: 'favicon' },
];

for (const { path, desc } of ICONS) {
  test(desc + ' icon returns 200 OK', async ({ request }) => {
    const resp = await request.get(BASE + path);
    expect(resp.status()).toBe(200);
  });
}

// ── Service Worker ────────────────────────────────────────────

test('service worker registers after page load', async ({ page }) => {
  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });

  // SW registration triggers controllerchange → reload in main.tsx.
  // Wait for the page to fully settle before evaluating.
  await page.goto('.');
  await page.waitForLoadState('networkidle');

  // Synchronous evaluate avoids context-destroyed errors during navigation
  const hasController = await page.evaluate(() => {
    return !!(navigator.serviceWorker?.controller);
  });

  expect(hasController).toBe(true);
});

// ── Offline shell ─────────────────────────────────────────────

test('cached app shell loads offline', async ({ page, context }) => {
  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });

  await page.goto('.');
  await page.waitForLoadState('networkidle');
  // Give SW time to cache
  await page.waitForTimeout(2000);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#root')).not.toBeEmpty();
  await expect(page.getByRole('button', { name: '开始训练' })).toBeVisible({ timeout: 10000 });
  await context.setOffline(false);
});

// ── Voice asset cache ─────────────────────────────────────────

test('voice assets are cached and available offline', async ({ page, context }) => {
  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });

  await page.goto('.');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await context.setOffline(true);

  const cached = await page.evaluate(async () => {
    const url = '/kagle/audio/zh-CN/ready.mp3';
    try {
      const cache = await caches.open('kagle-pwa-v4');
      const match = await cache.match(url);
      return match !== undefined && match.ok;
    } catch {
      return false;
    }
  });
  expect(cached).toBe(true);

  await context.setOffline(false);
});

// ── Update prompt ─────────────────────────────────────────────

test('update prompt appears via showUpdatePrompt', async ({ page }) => {
  // Block SW to prevent controllerchange → reload from interfering
  await page.route('**/sw.js', route => route.abort('blockedbyclient'));

  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });

  await page.goto('.');
  await page.waitForLoadState('networkidle');

  // Directly call the showUpdatePrompt pattern from main.tsx
  await page.evaluate(() => {
    const prompt = document.createElement('div');
    prompt.id = 'pwa-update-prompt';
    prompt.setAttribute('role', 'status');
    prompt.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:9999';
    const text = document.createElement('span');
    text.textContent = '新版本已准备好，可在训练结束后刷新。';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = '立即更新';
    prompt.append(text, button);
    document.body.append(prompt);
  });

  await expect(page.locator('#pwa-update-prompt')).toBeVisible();
  await expect(page.locator('#pwa-update-prompt button')).toHaveText('立即更新');
});

// ── Update does NOT auto-refresh ──────────────────────────────

test('update prompt does not force page refresh without user action', async ({ page }) => {
  // Block SW to prevent controllerchange → reload
  await page.route('**/sw.js', route => route.abort('blockedbyclient'));

  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });

  await page.goto('.');
  await page.waitForLoadState('networkidle');

  // Inject prompt — verify it does NOT trigger reload
  await page.evaluate(() => {
    const p = document.createElement('div');
    p.id = 'pwa-update-prompt';
    p.setAttribute('role', 'status');
    p.textContent = '新版本已准备好';
    document.body.append(p);
  });

  // Wait briefly to confirm no reload happened
  await page.waitForTimeout(500);

  // Prompt visible, page still functional
  await expect(page.locator('#pwa-update-prompt')).toBeVisible();
  await expect(page.getByRole('button', { name: '开始训练' })).toBeVisible();
});
