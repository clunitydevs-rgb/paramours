import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import test from 'node:test';
import { fixture, profiles } from './fixtures/phase2-data.mjs';

let app, mode = 'ok'; const calls = [];
const port = 4387, origin = `http://127.0.0.1:${port}`;
const api = createServer(async (req, res) => {
  let body = ''; for await (const chunk of req) body += chunk;
  const url = new URL(req.url, 'http://fixture').searchParams.get('url');
  calls.push({ url, body }); const result = fixture(url, body, mode);
  res.writeHead(result.status, { 'content-type': 'application/json' }); res.end(result.body);
});
test.before(async () => {
  await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
  app = spawn(process.execPath, ['--import', './tests/fixtures/phase1-fetch.mjs', 'dist/cl.app.paramours/server/server.mjs'], {
    env: { ...process.env, PORT: String(port), PHASE1_FIXTURE_ORIGIN: `http://127.0.0.1:${api.address().port}` },
    stdio: 'ignore', windowsHide: true
  });
  for (let n = 0; n < 80; n++) { try { await fetch(origin + '/home'); return; } catch { await new Promise(r => setTimeout(r, 100)); } }
  throw Error('Fresh SSR build did not start');
});
test.after(async () => { app?.kill(); await new Promise(resolve => api.close(resolve)); });
const path = id => `/profile/${id}/${profiles.find(p => p.iD_USUARIO === id)?.slug || 'Missing'}`;
const value = (html, name) => html.match(new RegExp(`<meta (?:name|property)="${name}" content="([^"]*)"`))?.[1]
  .replaceAll('&amp;', '&').replaceAll('&quot;', '"');
async function page(id) {
  const r = await fetch(origin + path(id), { redirect: 'manual' }); const html = await r.text();
  return { http: r.status, html, title: html.match(/<title>(.*?)<\/title>/s)?.[1],
    h1: html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1].replace(/<[^>]+>/g, '').trim(),
    description: value(html, 'description'), robots: value(html, 'robots'),
    canonical: html.match(/<link rel="canonical" href="([^"]*)"/)?.[1],
    schema: JSON.parse(html.match(/<script[^>]*id="profile-schema"[^>]*>(.*?)<\/script>/s)?.[1] || '{}') };
}

test('SSR uses the actual published description without altering its rendered original', async () => {
  const p = await page(6); assert.equal(p.http, 200);
  assert.match(p.description, /Atención individual de Fran/);
  assert.match(p.html, /Atención individual de Fran en un espacio privado con contacto directo\./);
  assert.equal(p.schema.description, p.description); assert.equal(value(p.html, 'og:description'), p.description);
});
test('SSR removes scripts, decodes entities and summarizes a long description naturally', async () => {
  const p = await page(78); assert.equal(p.http, 200);
  assert.match(p.description, /Atención individual & contacto directo con Favi/);
  assert.ok(!p.description.includes('not descriptive')); assert.ok(p.description.length < 240);
  assert.ok(!p.description.includes('<p>')); assert.equal(p.schema.description, p.description);
});
test('SSR omits an unverified age conflict only from metadata while preserving the original text', async () => {
  const p = await page(68); assert.equal(p.http, 200);
  assert.ok(!/39|41/.test(p.description)); assert.match(p.description, /Mi atención es independiente/);
  assert.match(p.html, /Tengo 41 años/); assert.equal(p.schema.description, p.description);
});
for (const id of [58, 88, 93]) test(`SSR minimal verified fallback for ${id}`, async () => {
  const p = await page(id), profile = profiles.find(p => p.iD_USUARIO === id);
  assert.equal(p.description, `${profile.nombrE_USUARIO}, ${id === 88 ? 'masajista' : 'escort'} en Providencia, Santiago.`);
  assert.equal(p.robots, 'index, follow, max-image-preview:large');
});
for (const id of [17, 25, 30, 74, 88, 91]) test(`SSR consistent Masajista in title/H1/social/JSON-LD for ${id}`, async () => {
  const p = await page(id); assert.equal(p.http, 200);
  assert.match(p.title, / - Masajista en /); assert.match(p.h1, /, Masajista en /);
  assert.match(p.description, /, masajista en /); assert.equal(p.schema.name, p.title);
  assert.equal(value(p.html, 'og:title'), p.title); assert.equal(value(p.html, 'twitter:title'), p.title);
  assert.match(p.schema.breadcrumb.itemListElement[1].name, /^Masajistas en /);
  assert.equal(p.canonical, `https://paramours.cl${path(id)}`);
});
for (const [id, city] of [[60, 'Caldera'], [61, 'Calama']]) test(`SSR never appends Santiago to ${city}`, async () => {
  const p = await page(id); assert.match(p.title, new RegExp(`en ${city} \\| Paramours$`));
  assert.match(p.h1, new RegExp(`en ${city}$`)); assert.ok(!p.description.includes('Santiago'));
  assert.equal(p.schema.breadcrumb.itemListElement[1].item, `https://paramours.cl/escort-${city.toLowerCase()}`);
});
test('SSR isolates concurrent profile summaries and transfers no private response fields or duplicate lookups', async () => {
  calls.length = 0; const result = await Promise.all([6, 25, 78].map(page));
  for (const [index, id] of [6, 25, 78].entries()) {
    const p = result[index], expected = profiles.find(p => p.iD_USUARIO === id);
    assert.equal(p.schema.mainEntity.name, expected.nombrE_USUARIO); assert.ok(!p.html.includes('SECRET_'));
    assert.equal(calls.filter(c => c.url.endsWith('/ClientById') && JSON.parse(c.body).sUid === id).length, 1);
  }
});
test('SSR still gives a true 404 for missing profiles', async () => {
  const p = await page(999999); assert.equal(p.http, 404); assert.equal(p.robots, 'noindex, follow');
  assert.equal(p.canonical, undefined); assert.deepEqual(p.schema, {});
});
test('SSR essential API failure stays 503 without invented SEO or noindex', async () => {
  mode = '503';
  try { const p = await page(6); assert.equal(p.http, 503); assert.equal(p.robots, undefined); assert.equal(p.canonical, undefined); }
  finally { mode = 'ok'; }
  assert.equal((await page(6)).http, 200);
});
