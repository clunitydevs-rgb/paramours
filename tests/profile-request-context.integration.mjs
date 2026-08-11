import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import test from 'node:test';

const apiPort = 4326;
const appPort = 4327;
const origin = `http://127.0.0.1:${appPort}`;
const callsById = new Map();

function profile(id, name, slug, photo = '', city = 999, commune = 999) {
  return {
    iD_USUARIO: id,
    nombrE_USUARIO: name,
    slug,
    estado: 'V',
    tipo: '2',
    descripcion: '',
    fotO_PERFIL: photo,
    ciudad: city,
    comuna: commune,
    metro: 0
  };
}

const profiles = new Map([
  [15, profile(15, 'Elida Morat', 'Escort-Elida-Morat', 'elida-profile.jpg', 0, 1)],
  [16, profile(16, 'Perfil Dos', 'Escort-Perfil-Dos')]
]);

const api = createServer((req, res) => {
  let body = '';
  req.setEncoding('utf8');
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const id = Number(JSON.parse(body).sUid);
    callsById.set(id, (callsById.get(id) ?? 0) + 1);
    const found = profiles.get(id);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(found
      ? { ncoderror: '0', message: '', oClient: found }
      : { ncoderror: '1', message: 'Perfil no encontrado', oClient: null }));
  });
});

const app = spawn(process.execPath, ['dist/cl.app.paramours/server/server.mjs'], {
  env: {
    ...process.env,
    PORT: String(appPort),
    PARAMOURS_PROFILE_API_URL: `http://127.0.0.1:${apiPort}/ClientById`
  },
  stdio: 'ignore',
  windowsHide: true
});

async function request(path) {
  return fetch(`${origin}${path}`, {
    headers: { host: 'paramours.cl', 'x-forwarded-host': 'paramours.cl' },
    redirect: 'manual'
  });
}

async function waitForApp() {
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

test.before(async () => {
  await new Promise((resolve, reject) => {
    api.once('error', reject);
    api.listen(apiPort, '127.0.0.1', resolve);
  });
  await waitForApp();
});

test.after(async () => {
  app.kill();
  await new Promise(resolve => api.close(resolve));
});

test.beforeEach(() => callsById.clear());

test('official profile renders with one ClientById call', async () => {
  const response = await request('/profile/15/Escort-Elida-Morat');
  assert.equal(response.status, 200);
  assert.equal(callsById.get(15), 1);
});

test('profile main photo is an eager high-priority SSR image', async () => {
  const response = await request('/profile/15/Escort-Elida-Morat');
  const html = await response.text();
  const image = html.match(/<img[^>]+class="profile-main-image"[^>]*>/i)?.[0] ?? '';

  assert.equal(response.status, 200);
  assert.match(image, /src="https:\/\/paramoursfilesblobazure\.blob\.core\.windows\.net\/rpsfilescontainer\/elida-profile\.jpg"/i);
  assert.match(image, /alt="Elida Morat en Providencia"/i);
  assert.match(image, /width="300"/i);
  assert.match(image, /height="300"/i);
  assert.match(image, /loading="eager"/i);
  assert.match(image, /fetchpriority="high"/i);
});

test('profile without a photo renders the existing advertiser fallback', async () => {
  const response = await request('/profile/16/Escort-Perfil-Dos');
  const html = await response.text();
  const image = html.match(/<img[^>]+class="profile-main-image"[^>]*>/i)?.[0] ?? '';

  assert.equal(response.status, 200);
  assert.match(image, /src="https:\/\/paramoursfilesblobazure\.blob\.core\.windows\.net\/rpsfilescontainer\/avatar_anunciante\.png"/i);
  assert.match(image, /alt="Perfil Dos en Santiago"/i);
  assert.doesNotMatch(image, /(?:src=""|src="null"|src="undefined")/i);
});

test('incorrect slug redirects with one ClientById call', async () => {
  const response = await request('/profile/15/slug-incorrecto');
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), '/profile/15/Escort-Elida-Morat');
  assert.equal(callsById.get(15), 1);
});

test('nonexistent profile renders 404 with one ClientById call', async () => {
  const response = await request('/profile/999999/test');
  assert.equal(response.status, 404);
  assert.equal(callsById.get(999999), 1);
});

test('concurrent profile requests keep request-scoped data isolated', async () => {
  const [first, second] = await Promise.all([
    request('/profile/15/Escort-Elida-Morat'),
    request('/profile/16/Escort-Perfil-Dos')
  ]);
  const [firstHtml, secondHtml] = await Promise.all([first.text(), second.text()]);

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(callsById.get(15), 1);
  assert.equal(callsById.get(16), 1);
  assert.match(firstHtml, /Elida Morat/);
  assert.doesNotMatch(firstHtml, /Perfil Dos/);
  assert.match(secondHtml, /Perfil Dos/);
  assert.doesNotMatch(secondHtml, /Elida Morat/);
});
