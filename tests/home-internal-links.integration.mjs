import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const port = 4324;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['dist/cl.app.paramours/server/server.mjs'], {
  env: { ...process.env, PORT: String(port) },
  stdio: 'ignore',
  windowsHide: true
});

async function request(path) {
  return fetch(`${origin}${path}`, { headers: { host: 'paramours.cl' }, redirect: 'manual' });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      if ((await request('/home')).status === 301) return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  throw new Error('SSR server did not become ready');
}

function anchors(html) {
  return Array.from(html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi), match => ({
    href: match[1],
    text: match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  }));
}

test.before(async () => waitForServer());
test.after(() => server.kill());

test('Home SSR links only active communes with descriptive anchor text', async () => {
  const [homeHtml, sitemapXml, communesJson] = await Promise.all([
    request('/').then(response => response.text()),
    request('/sitemap.xml').then(response => response.text()),
    readFile('public/assets/data/comunas.json', 'utf8')
  ]);
  const communes = JSON.parse(communesJson);
  const communeByPath = new Map(communes.map(commune => [`/escort-${commune.slug}`, commune]));
  const sitemapPaths = new Set(Array.from(sitemapXml.matchAll(/<loc>https:\/\/paramours\.cl(\/escort-[^<]+)<\/loc>/g), match => match[1]));
  const activeCommunePaths = new Set([...sitemapPaths].filter(path => communeByPath.has(path)));
  const homeCommuneAnchors = anchors(homeHtml).filter(anchor => communeByPath.has(anchor.href));
  const homeCommunePaths = new Set(homeCommuneAnchors.map(anchor => anchor.href));

  assert.deepEqual([...homeCommunePaths].sort(), [...activeCommunePaths].sort());
  assert.ok(homeCommunePaths.size > 0);
  assert.ok(communes.some(commune => !homeCommunePaths.has(`/escort-${commune.slug}`)));

  for (const anchor of homeCommuneAnchors) {
    assert.equal(anchor.text, `Escorts en ${communeByPath.get(anchor.href).nombre}`);
  }
});

test('Home SSR exposes crawlable profile anchors', async () => {
  const html = await request('/').then(response => response.text());
  const profileAnchors = anchors(html).filter(anchor => anchor.href.startsWith('/profile/'));
  assert.ok(profileAnchors.length > 0);
  assert.ok(profileAnchors.every(anchor => /^\/profile\/\d+\/[^/]+$/.test(anchor.href)));
});

test('an active directory SSR links its active profiles with HTML anchors', async () => {
  const homeHtml = await request('/').then(response => response.text());
  const communeHref = anchors(homeHtml).find(anchor => anchor.href.startsWith('/escort-') && anchor.href !== '/escort-santiago')?.href;
  assert.ok(communeHref);

  const directoryHtml = await request(communeHref).then(response => response.text());
  const profileAnchors = anchors(directoryHtml).filter(anchor => anchor.href.startsWith('/profile/'));
  assert.ok(profileAnchors.length > 0);
  assert.ok(profileAnchors.every(anchor => /^\/profile\/\d+\/[^/]+$/.test(anchor.href)));
});