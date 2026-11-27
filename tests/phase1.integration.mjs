import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fixture, profiles } from './fixtures/phase1-data.mjs';

let app, mode = 'ok'; const calls = [];
const port = 4386, origin = `http://127.0.0.1:${port}`;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const api = createServer(async (req, res) => {
  let body = ''; for await (const c of req) body += c;
  const url = new URL(req.url, 'http://fixture').searchParams.get('url');
  const side = req.headers['x-fixture-side'] || 'browser';
  calls.push({ url, body, side });
  const localMode = req.headers['x-fixture-mode'] || mode;
  if (/\/(ClientById|GetClients)$/.test(url) && localMode === 'disconnect') { req.socket.destroy(); return; }
  if (/\/(ClientById|GetClients)$/.test(url) && localMode === 'timeout') { await sleep(6500); }
  const result = fixture(url, body, localMode);
  if (!res.destroyed) { res.writeHead(result.status, { 'content-type': 'application/json' }); res.end(result.body); }
});
async function start(nextMode = 'ok') {
  app?.kill(); mode = nextMode; calls.length = 0;
  await sleep(100);
  app = spawn(process.execPath, ['--import', './tests/fixtures/phase1-fetch.mjs', 'dist/cl.app.paramours/server/server.mjs'], {
    env: { ...process.env, PORT: String(port), PHASE1_FIXTURE_ORIGIN: `http://127.0.0.1:${api.address().port}` },
    stdio: 'ignore', windowsHide: true
  });
  for (let n = 0; n < 80; n++) { try { await fetch(origin + '/home'); return; } catch { await sleep(100); } }
  throw Error('SSR fixture failed to start');
}
const request = path => fetch(origin + path, { redirect: 'manual' });
const profilePath = id => `/profile/${id}/${profiles.find(p => p.iD_USUARIO === id)?.slug || 'Missing'}`;
function seo(html) {
  return { title: html.match(/<title>(.*?)<\/title>/s)?.[1] || '',
    canonical: [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map(m => m[1]),
    robots: html.match(/<meta name="robots" content="([^"]*)"/)?.[1],
    description: html.match(/<meta name="description" content="([^"]*)"/)?.[1],
    ogUrl: html.match(/<meta property="og:url" content="([^"]*)"/)?.[1],
    h1: html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1].replace(/<[^>]+>/g, '').trim(),
    schemas: [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map(m => JSON.parse(m[1])) };
}
test.before(async () => { await new Promise(resolve => api.listen(0, '127.0.0.1', resolve)); await start(); });
test.after(async () => { app?.kill(); await new Promise(resolve => api.close(resolve)); });

test('SSR transfers only public profile data and isolates concurrent identities', async () => {
  const results = await Promise.all([6, 78, 58].map(async id => {
    const r = await request(profilePath(id)); const html = await r.text(); assert.equal(r.status, 200);
    assert.deepEqual(seo(html).canonical, [`https://paramours.cl${profilePath(id)}`]);
    assert.ok(html.includes(`public-page:profile:${id}`)); assert.ok(!html.includes('SECRET_'));
    const state = JSON.parse(html.match(/<script[^>]*id="ng-state"[^>]*>(.*?)<\/script>/s)?.[1] || '{}');
    assert.equal(state[`public-page:profile:${id}`].profile.iD_USUARIO, id);
    assert.ok(!Object.keys(state).some(key => /^public-page:profile:/.test(key) && key !== `public-page:profile:${id}`));
    return id;
  }));
  for (const id of results) assert.equal(calls.filter(c => c.url.endsWith('/ClientById') && JSON.parse(c.body).sUid === id).length, 1);
});

test('a still-valid public catalog cache preserves a successful page during an upstream failure', async () => {
  await request('/');
  mode = '503';
  try { const r = await request('/'); assert.equal(r.status, 200); assert.ok(seo(await r.text()).robots.startsWith('index')); }
  finally { mode = 'ok'; }
});

for (const failure of ['500', '503', 'invalid', 'functional', 'disconnect', 'timeout']) {
  test(`SSR ${failure}: essential failures are 503, never false 404, indexable empty success or noindex`, { timeout: 45000 }, async () => {
    await start(failure);
    for (const path of [profilePath(6), '/', '/escort-providencia', '/sexo-providencia']) {
      const r = await request(path); const html = await r.text(); assert.equal(r.status, 503, path);
      assert.equal(seo(html).robots, undefined, path); assert.deepEqual(seo(html).canonical, [], path);
    }
    await start(); const recovered = await request(profilePath(6)); assert.equal(recovered.status, 200);
    assert.ok(seo(await recovered.text()).title.includes('Fran'));
  });
}
test('SSR rejects an API payload for a different identity without redirecting', async () => {
  await start('mismatch'); const r = await request(profilePath(6)); assert.equal(r.status, 503);
  assert.equal(r.headers.get('location'), null); await start();
});
test('real absence is 404 and legitimate empty locations stay 200/noindex', async () => {
  const missing = await request('/profile/999999/Missing'); assert.equal(missing.status, 404);
  const empty = await request('/escort-calama'); assert.equal(empty.status, 200);
  assert.equal(seo(await empty.text()).robots, 'noindex, follow');
});

test('browser hydration trace and real router transitions use controlled APIs, including late responses', {
  skip: !process.env.CHROME_BIN, timeout: 90000
}, async () => {
  await start();
  const userDir = await mkdtemp(join(tmpdir(), 'paramours-phase1-'));
  const edge = spawn(process.env.CHROME_BIN, ['--headless', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=9438', `--user-data-dir=${userDir}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
  let socket, nextId = 0, delayId = null; const pending = new Map(), browserCalls = [], traces = [];
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId; const timer = setTimeout(() => reject(Error(`CDP timeout ${method}`)), 15000);
    pending.set(id, value => { clearTimeout(timer); value.error ? reject(Error(JSON.stringify(value.error))) : resolve(value.result); });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;
  const snapshot = () => evaluate(`({url:location.pathname,title:document.title,h1:document.querySelector('app-profile h1')?.textContent||document.querySelector('h1')?.textContent,
    description:document.querySelector('meta[name="description"]')?.content,canonical:document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    robots:document.querySelector('meta[name="robots"]')?.content,ogUrl:document.querySelector('meta[property="og:url"]')?.content,
    schema:document.querySelector('#profile-schema')?.textContent,markers:document.querySelectorAll('[ngh]').length})`);
  async function settle(predicate) { for (let n = 0; n < 100; n++) { const s = await snapshot(); if (predicate(s) && !s.markers) return s; await sleep(75); } throw Error('DOM did not settle'); }
  async function nav(path) { await evaluate(`history.pushState({},'',${JSON.stringify(path)});dispatchEvent(new PopStateEvent('popstate',{state:{}}));true`); }
  function assertProfile(s, id) { const p = profiles.find(p => p.iD_USUARIO === id); assert.equal(s.url, profilePath(id));
    assert.equal(s.canonical, `https://paramours.cl${profilePath(id)}`); assert.equal(s.ogUrl, s.canonical);
    assert.ok(s.title.includes(p.nombrE_USUARIO)); assert.ok(s.description.includes(p.nombrE_USUARIO));
    assert.ok(s.h1.includes(`${p.nombrE_USUARIO}, ${p.genero === 0 ? 'Masajista' : 'Escort'}`));
    assert.equal(JSON.parse(s.schema).mainEntity.name, p.nombrE_USUARIO); }
  try {
    let tabs; for (let n = 0; n < 80; n++) { try { tabs = await (await fetch('http://127.0.0.1:9438/json')).json(); break; } catch { await sleep(100); } }
    socket = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(resolve => socket.onopen = resolve);
    socket.onmessage = event => { const message = JSON.parse(event.data);
      if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id); return; }
      if (message.method === 'Fetch.requestPaused') void (async () => {
        const p = message.params, r = p.request;
        let result = { status: 204, body: '' };
        if (r.url.startsWith('https://cl.api.')) {
          browserCalls.push({ url: r.url, body: r.postData });
          if (r.method !== 'OPTIONS') {
            if (r.url.endsWith('/ClientById') && Number(JSON.parse(r.postData).sUid) === delayId) await sleep(800);
            result = fixture(r.url, r.postData || '', 'ok');
          }
        }
        await send('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: result.status,
          responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' },
            { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' }, { name: 'Access-Control-Allow-Headers', value: 'authorization,content-type,x-page-path' }],
          body: Buffer.from(result.body).toString('base64') });
      })().catch(() => {});
    };
    await send('Page.enable'); await send('Fetch.enable', { patterns: [{ urlPattern: 'https://*/*' }] });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__seoTrace=[];new MutationObserver(()=>{const s={title:document.title,robots:document.querySelector('meta[name="robots"]')?.content,description:document.querySelector('meta[name="description"]')?.content,ogUrl:document.querySelector('meta[property="og:url"]')?.content,canonical:document.querySelector('link[rel="canonical"]')?.getAttribute('href'),h1:document.querySelector('h1')?.textContent.trim(),schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>x.textContent)};if(JSON.stringify(s)!==JSON.stringify(window.__seoTrace.at(-1)))window.__seoTrace.push(s);}).observe(document,{childList:true,subtree:true,attributes:true,characterData:true});` });
    for (const path of [profilePath(6), '/sexo-providencia', '/escort-providencia', '/']) {
      browserCalls.length = 0;
      const initial = seo(await (await request(path)).text());
      await send('Page.navigate', { url: origin + path }); await settle(s => s.canonical === initial.canonical[0]);
      await sleep(200); const trace = await evaluate('window.__seoTrace'); traces.push({ path, trace });
      assert.ok(!trace.some(s => s.title === 'Paramours' || s.robots?.startsWith('noindex')), path);
      for (const sample of trace) {
        if (sample.description) assert.equal(sample.description, initial.description);
        if (sample.ogUrl) assert.equal(sample.ogUrl, initial.ogUrl);
        if (sample.h1) assert.equal(sample.h1, initial.h1);
        const parsed = sample.schemas.filter(s => s.trim()).map(s => JSON.parse(s));
        if (parsed.length) assert.deepEqual(parsed, initial.schemas);
      }
      assert.equal(browserCalls.filter(c => /\/(ClientById|GetClients)$/.test(c.url)).length, 0, `No redundant critical API on hydration ${path}`);
    }
    for (const order of [[58, 78, 6], [6, 78, 58]]) {
      await nav(profilePath(order[0])); await settle(s => s.title.includes(profiles.find(p => p.iD_USUARIO === order[0]).nombrE_USUARIO));
      delayId = order[1]; await nav(profilePath(order[1])); await sleep(100);
      const loading = await snapshot(); assert.equal(loading.canonical, undefined); assert.equal(loading.description, undefined);
      assert.equal(loading.ogUrl, undefined); assert.ok(!loading.schema);
      await nav(profilePath(order[2]));
      const s = await settle(s => s.canonical === `https://paramours.cl${profilePath(order[2])}`); assertProfile(s, order[2]);
      await sleep(900); assertProfile(await snapshot(), order[2]); delayId = null;
    }
    for (const destination of ['/', '/blog', '/profile/999999/Missing']) {
      delayId = 78; await nav(profilePath(78)); await sleep(100); await nav(destination);
      await settle(s => s.url === destination && (destination.includes('Missing') ? s.robots === 'noindex, follow' : !!s.title));
      await sleep(900); const s = await snapshot(); assert.equal(s.url, destination); assert.ok(!s.schema); assert.ok(!s.title.includes('Favi')); delayId = null;
    }
    for (const id of [25, 6, 25, 88, 58]) { await nav(profilePath(id)); const s = await settle(s => s.canonical === `https://paramours.cl${profilePath(id)}`); assertProfile(s, id); }
    if (process.env.PHASE1_ARTIFACT_DIR) await writeFile(join(process.env.PHASE1_ARTIFACT_DIR, 'hydration-traces.json'), JSON.stringify(traces, null, 2));
  } finally { socket?.close(); edge.kill(); }
});
