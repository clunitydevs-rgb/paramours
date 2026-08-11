import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const indexHtml = await readFile('src/index.html', 'utf8');
const analyticsService = await readFile('src/app/service/analytics.service.ts', 'utf8');
const appComponent = await readFile('src/app/app.ts', 'utf8');
const profileComponent = await readFile('src/app/profile/profile.ts', 'utf8');
const analyticsScript = indexHtml.match(/<!-- Google tag \(gtag\.js\) -->\s*<script>([\s\S]*?)<\/script>/)?.[1];

assert.ok(analyticsScript, 'GA4 inline bootstrap script was not found');

function createAnalyticsRuntime({ supportsIdleCallback = true } = {}) {
  const listeners = new Map();
  const timers = [];
  const idleCallbacks = [];
  const scripts = [];
  const document = {
    querySelector(selector) {
      if (selector !== 'script[data-google-analytics]') return null;
      return scripts.find(script => script.dataset.googleAnalytics === 'true') ?? null;
    },
    createElement(tagName) {
      assert.equal(tagName, 'script');
      return { async: false, dataset: {}, src: '' };
    },
    head: {
      appendChild(script) {
        scripts.push(script);
      }
    }
  };
  const window = {
    addEventListener(eventName, callback, options) {
      listeners.set(eventName, { callback, options });
    },
    setTimeout(callback, delay) {
      timers.push({ callback, delay });
      return timers.length;
    }
  };

  if (supportsIdleCallback) {
    window.requestIdleCallback = (callback, options) => {
      idleCallbacks.push({ callback, options });
      return idleCallbacks.length;
    };
  }

  window.window = window;
  window.document = document;
  window.Date = Date;
  vm.runInNewContext(analyticsScript, window);

  return {
    window,
    scripts,
    timers,
    idleCallbacks,
    trigger(eventName) {
      listeners.get(eventName)?.callback();
    }
  };
}

test('GA4 does not download immediately and an interaction only schedules idle work', () => {
  const runtime = createAnalyticsRuntime();

  assert.equal(runtime.scripts.length, 0);
  assert.deepEqual(runtime.window.dataLayer.length, 2);
  assert.equal(runtime.window.dataLayer[0][0], 'js');
  assert.deepEqual(Array.from(runtime.window.dataLayer[1]), ['config', 'G-BT2BN7FP87']);

  runtime.trigger('pointerdown');
  assert.equal(runtime.scripts.length, 0);
  assert.equal(runtime.idleCallbacks.length, 1);
  assert.equal(runtime.idleCallbacks[0].options.timeout, 2000);

  runtime.trigger('touchstart');
  runtime.trigger('keydown');
  assert.equal(runtime.idleCallbacks.length, 1);

  runtime.idleCallbacks[0].callback();
  assert.equal(runtime.scripts.length, 1);
  assert.equal(runtime.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-BT2BN7FP87');
  assert.equal(runtime.scripts[0].async, true);
});

test('GA4 uses a zero-delay timer fallback and the 15-second no-interaction timeout still loads once', () => {
  const fallbackRuntime = createAnalyticsRuntime({ supportsIdleCallback: false });
  fallbackRuntime.trigger('pointerdown');
  assert.equal(fallbackRuntime.scripts.length, 0);
  const deferredTimer = fallbackRuntime.timers.find(timer => timer.delay === 0);
  assert.ok(deferredTimer);
  deferredTimer.callback();
  assert.equal(fallbackRuntime.scripts.length, 1);

  const timeoutRuntime = createAnalyticsRuntime();
  timeoutRuntime.trigger('load');
  const automaticTimer = timeoutRuntime.timers.find(timer => timer.delay === 15000);
  assert.ok(automaticTimer);
  automaticTimer.callback();
  assert.equal(timeoutRuntime.scripts.length, 1);
  timeoutRuntime.trigger('pointerdown');
  assert.equal(timeoutRuntime.idleCallbacks.length, 0);
  assert.equal(timeoutRuntime.scripts.length, 1);
});

test('early custom events remain queued and their emitters preserve names and parameters', () => {
  const runtime = createAnalyticsRuntime();
  runtime.window.gtag('event', 'view_profile', { profile_slug: 'perfil-prueba' });
  runtime.window.gtag('event', 'click_whatsapp', { click_whatsapp: 'Perfil Prueba' });

  assert.deepEqual(Array.from(runtime.window.dataLayer[2]), ['event', 'view_profile', { profile_slug: 'perfil-prueba' }]);
  assert.deepEqual(Array.from(runtime.window.dataLayer[3]), ['event', 'click_whatsapp', { click_whatsapp: 'Perfil Prueba' }]);
  assert.match(analyticsService, /gtag\('event', name, params\);/);
  assert.match(profileComponent, /trackEvent\('view_profile', \{\s*profile_slug: params\.get\('sLug'\)/);
  assert.match(profileComponent, /trackEvent\('click_whatsapp', \{\s*click_whatsapp: this\.oCliente\.nombrE_USUARIO/);
});

test('SPA tracking remains a single manual NavigationEnd path with no new page_view event', () => {
  assert.equal((appComponent.match(/analyticsService\.trackPage\(event\.urlAfterRedirects\)/g) ?? []).length, 1);
  assert.match(analyticsService, /gtag\('config', this\.measurementId, \{\s*page_path: url,\s*page_title: document\.title\s*\}\);/);
  assert.doesNotMatch(analyticsService, /gtag\('event', 'page_view'/);
});