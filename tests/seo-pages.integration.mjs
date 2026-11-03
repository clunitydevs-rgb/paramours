import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test from 'node:test';
const origin = 'http://127.0.0.1:4357';
const paths = ['/skokka-com/chile', '/locanto-cl/', '/gemidos-tv/chile', '/escort', '/escorts', '/escorts-chile', '/sexo-chile', '/sexo-santiago', '/sexo-providencia', '/sexo-las-condes', '/sectorvip', '/masajes-sensitivos'];
const server = spawn(process.execPath, ['--import', './tests/fixtures/seo-fetch.mjs', 'dist/cl.app.paramours/server/server.mjs'], {
  env: { ...process.env, PORT: '4357' }, stdio: 'ignore', windowsHide: true
});
const request = path => fetch(`${origin}${path}`, { headers: { host: 'paramours.cl' }, redirect: 'manual' });
test.before(async () => {
  for (let i = 0; i < 60; i++) {
    try { await request('/home'); return; } catch { await new Promise(resolve => setTimeout(resolve, 250)); }
  }
  throw new Error('SSR server did not start');
});
test.after(() => server.kill());
for (const path of paths) test(`SSR ${path} returns contextual HTML and metadata without redirect`, async () => {
  const response = await request(`${path}?utm_source=test`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('location'), null);
  const html = await response.text();
  const canonical = ['/escort', '/escorts'].includes(path) ? '/escorts-chile' : path;
  assert.ok(html.includes(`rel="canonical" href="https://paramours.cl${canonical}"`));
  assert.ok(html.includes(`property="og:url" content="https://paramours.cl${canonical}"`));
  assert.match(html, /<title>[^<]+Paramours<\/title>/);
  assert.match(html, /<meta name="description" content="[^"]+"/);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  assert.match(html, /<app-storieshome/);
  const cards = [...html.matchAll(/class="profile-card"[^>]*href="([^"]+)"/g)].map(m => m[1]);
  const expected = path === '/sexo-providencia' ? ['/profile/10/ana'] : path === '/sexo-las-condes' ? ['/profile/11/bea'] : path === '/sexo-santiago' ? ['/profile/10/ana', '/profile/11/bea'] : ['/profile/10/ana', '/profile/11/bea', '/profile/12/cata'];
  assert.deepEqual(cards, expected);
  assert.ok(html.includes(`name="robots" content="${['/escort', '/escorts'].includes(path) ? 'noindex' : 'index'}, follow`));
});
test('unknown and partially matching routes return 404 without home redirects', async () => {
  for (const path of ['/sexo-inexistente', '/sexo-providencia/extra', '/skokka-com/otro', '/escort/extra']) {
    const response = await request(path);
    assert.equal(response.status, 404, path);
    assert.equal(response.headers.get('location'), null);
    assert.match(await response.text(), /name="robots" content="noindex, follow"/);
  }
});
test('sitemap contains canonical indexable pages and excludes aliases', async () => {
  const xml = await (await request('/sitemap.xml')).text();
  for (const path of paths) {
    const entry = `<loc>https://paramours.cl${path}</loc>`;
    assert.equal(xml.includes(entry), !['/escort', '/escorts'].includes(path), path);
  }
});
test('home, commune pages and existing legacy redirects retain their behavior', async () => {
  assert.equal((await request('/')).status, 200);
  const commune = await request('/escort-providencia');
  assert.equal(commune.status, 200);
  assert.match(await commune.text(), /href="https:\/\/paramours.cl\/escort-providencia"/);
  assert.equal((await request('/escorts-santiago')).status, 301);
  assert.equal((await request('/home')).status, 301);
});
