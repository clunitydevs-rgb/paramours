import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test from 'node:test';

const port = 4322;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['dist/cl.app.paramours/server/server.mjs'], {
  env: { ...process.env, PORT: String(port) },
  stdio: 'ignore',
  windowsHide: true
});

async function request(path, host = 'paramours.cl') {
  return fetch(`${origin}${path}`, {
    headers: { host, 'x-forwarded-host': host },
    redirect: 'manual'
  });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      await request('/home');
      return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  throw new Error('SSR server did not become ready');
}

function expectNotFoundHtml(html) {
  assert.match(html, /class="error-code"[^>]*>404</i);
  assert.match(html, /<meta name="robots" content="noindex, follow"/i);
  assert.doesNotMatch(html, /<link[^>]+rel="canonical"/i);
  assert.doesNotMatch(html, /<script[^>]+type="application\/ld\+json"/i);
}

test.before(async () => waitForServer());
test.after(() => server.kill());

test('GET / returns 200', async () => {
  assert.equal((await request('/')).status, 200);
});

test('GET /home keeps its permanent redirect to /', async () => {
  const response = await request('/home');
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://paramours.cl/');
});

test('unknown Angular URL returns the 404 page without redirecting', async () => {
  const response = await request('/pagina-inexistente');
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('location'), null);
  expectNotFoundHtml(await response.text());
});

test('GET /404 returns 404', async () => {
  const response = await request('/404');
  assert.equal(response.status, 404);
  expectNotFoundHtml(await response.text());
});

test('invalid geographic directory returns 404', async () => {
  const response = await request('/escort-comuna-inexistente');
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('location'), null);
  expectNotFoundHtml(await response.text());
});

test('valid directory without profiles remains 200 and noindex', async () => {
  const response = await request('/escort-calama');
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<meta name="robots" content="noindex, follow"/i);
});

test('official profile slug is the only 200 URL', async () => {
  const officialPath = '/profile/15/Escort-Elida-Morat';
  const response = await request(officialPath);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<link rel="canonical" href="https:\/\/paramours\.cl\/profile\/15\/Escort-Elida-Morat"/i);
});

test('incorrect, lowercase, empty and trailing profile slugs redirect once to the official URL', async () => {
  const officialPath = '/profile/15/Escort-Elida-Morat';
  const variants = [
    '/profile/15/cualquier-texto',
    '/profile/15/escort-elida-morat',
    '/profile/15/slug-antiguo',
    '/profile/15',
    '/profile/15/',
    '/profile/15/Escort-Elida-Morat/'
  ];

  for (const variant of variants) {
    const response = await request(variant);
    assert.equal(response.status, 301, variant);
    assert.equal(response.headers.get('location'), officialPath, variant);
  }

  const finalResponse = await request(officialPath);
  assert.equal(finalResponse.status, 200);
  assert.equal(finalResponse.headers.get('location'), null);
});

test('www plus an incorrect profile slug reaches the canonical host and slug in one redirect', async () => {
  const response = await request('/profile/15/cualquier-texto', 'www.paramours.cl');
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://paramours.cl/profile/15/Escort-Elida-Morat');
});

test('nonexistent profile returns 404', async () => {
  const response = await request('/profile/999999/Escort-Inexistente');
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('location'), null);
  expectNotFoundHtml(await response.text());
});

test('existing legacy 301 redirects remain active', async () => {
  const response = await request('/escorts-santiago');
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), '/escort-santiago');
});