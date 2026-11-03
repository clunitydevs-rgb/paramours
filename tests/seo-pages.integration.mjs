import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test from 'node:test';
const origin = 'http://127.0.0.1:4357';
const paths = ['/skokka-com/chile', '/locanto-cl/', '/gemidos-tv/', '/escort', '/escorts', '/escorts-chile', '/sexo-chile', '/sexo-santiago', '/sexo-providencia', '/sexo-las-condes', '/sectorvip', '/masajes-sensitivos'];
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
  if (['/skokka-com/chile', '/locanto-cl/', '/gemidos-tv/', '/sectorvip'].includes(path)) {
    const description = 'Explora los perfiles publicados en Paramours y revisa la informaci\u00f3n de cada anunciante.';
    assert.match(html, /<h1[^>]*>Escorts en Chile \| Paramours<\/h1>/);
    assert.ok([...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].some(match => match[1] === description));
    assert.ok(!html.includes('id="seo-info-title"'));
    assert.ok(!html.includes('class="seo-content"'));
    const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(visible, /skokka|locanto|gemidos|sectorvip|afiliad|relaci[o\u00f3]n comercial|alternativa independiente/i);
    for (const [attribute, key, value] of [
      ['name', 'description', description], ['property', 'og:title', 'Escorts en Chile | Paramours'],
      ['property', 'og:description', description], ['name', 'twitter:title', 'Escorts en Chile | Paramours'],
      ['name', 'twitter:description', description]
    ]) assert.ok(html.includes(`${attribute}="${key}" content="${value}"`), key);
    assert.ok(html.includes('<title>Escorts en Chile | Paramours</title>'));
  }

  const cards = [...html.matchAll(/class="profile-card"[^>]*href="([^"]+)"/g)].map(m => m[1]);
  const expected = path === '/sexo-providencia' ? ['/profile/10/ana'] : path === '/sexo-las-condes' ? ['/profile/11/bea'] : path === '/sexo-santiago' ? ['/profile/10/ana', '/profile/11/bea'] : ['/profile/10/ana', '/profile/11/bea', '/profile/12/cata'];
  assert.deepEqual(cards, expected);
  assert.ok(html.includes(`name="robots" content="${['/escort', '/escorts'].includes(path) ? 'noindex' : 'index'}, follow`));
});
test('Gemidos URL variants and original URL remain available with one canonical sitemap entry', async () => {
  for (const path of ['/gemidos-tv', '/gemidos-tv/', '/gemidos-tv/chile']) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('location'), null);
    const html = await response.text();
    assert.ok(html.includes('rel="canonical" href="https://paramours.cl/gemidos-tv/"'));
    assert.equal((html.match(/class="profile-card"/g) || []).length, 3);
  }
  const xml = await (await request('/sitemap.xml')).text();
  assert.ok(!xml.includes('<loc>https://paramours.cl/gemidos-tv/chile</loc>'));
  assert.equal((xml.match(/<loc>https:\/\/paramours.cl\/gemidos-tv\/<\/loc>/g) || []).length, 1);
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
