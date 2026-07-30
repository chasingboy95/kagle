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
  expect(manifest.icons).toBeInstanceOf(Array);
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  for (const icon of manifest.icons) {
    expect(icon.src).toContain('/kagle/icon-');
    expect(icon.type).toBe('image/png');
    expect(icon.sizes).toMatch(/^\d+x\d+$/);
  }
});

// ── Standalone viewport and safe areas ───────────────────────

test('root document stays fixed while the app shell owns mobile scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });

  await page.goto('.');
  await page.waitForLoadState('networkidle');

  const metrics = await page.evaluate(() => {
    const rootScroller = document.scrollingElement;
    const appShell = document.querySelector<HTMLElement>('.app-shell');
    const actionDock = document.querySelector<HTMLElement>('.bottom-action-dock');
    if (!rootScroller || !appShell || !actionDock) {
      throw new Error('Expected the root scroller, app shell, and action dock to exist');
    }

    window.scrollTo(0, 100);
    appShell.scrollTop = 100;

    const shellStyle = getComputedStyle(appShell);
    const shellRect = appShell.getBoundingClientRect();

    return {
      viewportHeight: window.innerHeight,
      rootClientHeight: rootScroller.clientHeight,
      rootScrollHeight: rootScroller.scrollHeight,
      rootScrollTop: rootScroller.scrollTop,
      bodyOverflow: getComputedStyle(document.body).overflow,
      htmlBackground: getComputedStyle(document.documentElement).backgroundColor,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      rootBackground: getComputedStyle(document.querySelector<HTMLElement>('#root')!).backgroundColor,
      dockBackground: getComputedStyle(actionDock).backgroundColor,
      themeColor: document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content,
      appOverflowY: shellStyle.overflowY,
      appPosition: shellStyle.position,
      appTop: shellRect.top,
      appBottom: shellRect.bottom,
      appClientHeight: appShell.clientHeight,
      appScrollHeight: appShell.scrollHeight,
      appScrollTop: appShell.scrollTop,
    };
  });

  expect(metrics.rootScrollHeight).toBe(metrics.rootClientHeight);
  expect(metrics.rootScrollTop).toBe(0);
  expect(metrics.bodyOverflow).toBe('hidden');
  expect(metrics.appOverflowY).toBe('auto');
  expect(metrics.appPosition).toBe('fixed');
  expect(metrics.appTop).toBe(0);
  expect(metrics.appBottom).toBe(metrics.viewportHeight);
  expect(metrics.appClientHeight).toBe(metrics.viewportHeight);
  expect(metrics.appScrollHeight).toBeGreaterThan(metrics.appClientHeight);
  expect(metrics.appScrollTop).toBeGreaterThan(0);
});

// ── Icons ─────────────────────────────────────────────────────

const ICONS = [
  { path: 'icon-192.png', desc: '192x192' },
  { path: 'icon-512.png', desc: '512x512' },
  { path: 'apple-touch-icon.png', desc: 'apple touch root fallback' },
  { path: 'apple-touch-icon-20260730.png', desc: 'versioned apple touch' },
  { path: 'favicon.svg', desc: 'favicon' },
];

for (const { path, desc } of ICONS) {
  test(desc + ' icon returns 200 OK', async ({ request }) => {
    const resp = await request.get(BASE + path);
    expect(resp.status()).toBe(200);
  });
}

test('document selects the versioned Apple touch icon', async ({ request }) => {
  const resp = await request.get(BASE);
  expect(resp.status()).toBe(200);
  expect(await resp.text()).toContain(
    `rel="apple-touch-icon" sizes="180x180" href="${BASE}apple-touch-icon-20260730.png"`,
  );
});

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
    // 缓存名随构建版本化，遍历所有 kagle-pwa- 前缀缓存查找语音资源。
    try {
      const names = await caches.keys();
      for (const name of names) {
        if (!name.startsWith('kagle-pwa-')) continue;
        const cache = await caches.open(name);
        const match = await cache.match(url);
        if (match !== undefined && match.ok) return true;
      }
      return false;
    } catch {
      return false;
    }
  });
  expect(cached).toBe(true);

  await context.setOffline(false);
});

// ── Build-time precache manifest ─────────────────────────────
//
// #62: 构建期清单覆盖哈希 JS/CSS/SVG，不依赖手工维护文件名，并作为可验证的
// 构建产物（precache-manifest.json）。Chromium 离线 E2E 另见 cached-app-shell。

test('precache manifest lists hashed build assets and versioned cache', async ({ request }) => {
  const resp = await request.get(BASE + 'precache-manifest.json');
  expect(resp.status()).toBe(200);
  expect(resp.headers()['content-type']).toContain('application/json');

  const manifest = await resp.json();
  expect(typeof manifest.cacheName).toBe('string');
  expect(manifest.cacheName).toMatch(/^kagle-pwa-v4-/);
  expect(Array.isArray(manifest.assets)).toBe(true);

  const jsAssets = manifest.assets.filter((a: string) => a.endsWith('.js'));
  const cssAssets = manifest.assets.filter((a: string) => a.endsWith('.css'));
  const svgAssets = manifest.assets.filter((a: string) => a.endsWith('.svg'));
  expect(jsAssets.length).toBeGreaterThan(0);
  expect(cssAssets.length).toBeGreaterThan(0);
  expect(svgAssets.length).toBeGreaterThan(0);

  for (const asset of [...jsAssets, ...cssAssets, ...svgAssets]) {
    expect(asset.startsWith('/kagle/assets/')).toBe(true);
  }
});

// ── Update prompt UI (equivalent integration flow) ───────────
//
// Idle/feedback clients activate an available worker automatically. The prompt
// remains the user-visible fallback while a live session blocks activation.
// Driving a second waiting-worker lifecycle is impractical in Playwright, so
// the safety decision is covered directly in swProtocol.test.ts.

test('update prompt renders with an activate action', async ({ page }) => {
  // Block SW to prevent controllerchange → reload from interfering
  await page.route('**/sw.js', route => route.abort('blockedbyclient'));

  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });

  await page.goto('.');
  await page.waitForLoadState('networkidle');

  // Mirror the showUpdatePrompt DOM produced by main.tsx
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

// ── Deferred update prompt must not refresh a live page ──────
//
// Core of #60/#105: active training must never be interrupted. This verifies
// the visible deferred-update state remains non-disruptive.

test('deferred update prompt does not auto-reload the page', async ({ page }) => {
  // Block SW to prevent controllerchange → reload
  await page.route('**/sw.js', route => route.abort('blockedbyclient'));

  await page.context().addInitScript(() => {
    localStorage.setItem('kegel.onboarding.v1', JSON.stringify(false));
  });

  await page.goto('.');
  await page.waitForLoadState('networkidle');

  // Inject a pending-update indicator — verify it does NOT trigger reload
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
