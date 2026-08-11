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

test('Home SSR exposes the requested on-page SEO', async () => {
  const html = await request('/').then(response => response.text());
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  const robots = html.match(/<meta name="robots" content="([^"]+)"/i)?.[1];
  const h1s = Array.from(html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi), match => match[1].replace(/<[^>]+>/g, '').trim());
  const h2s = Array.from(html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi), match => match[1].replace(/<[^>]+>/g, '').trim());
  const websiteSchema = JSON.parse(html.match(/<script id="website-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1] ?? '{}');

  assert.equal(title, 'Escorts en Santiago, Chile | Paramours');
  assert.equal(description, 'Explora escorts en Santiago en Paramours: perfiles de acompañantes adultas independientes y opciones organizadas por comuna para facilitar tu búsqueda.');
  assert.equal(canonical, 'https://paramours.cl');
  assert.equal(robots, 'index, follow, max-image-preview:large');
  assert.deepEqual(h1s, ['Escorts en Santiago']);
  assert.ok(h2s.includes('Escorts disponibles en Santiago'));
  assert.ok(h2s.includes('Escorts por ubicación en Santiago'));
  assert.match(html, /Paramours es un directorio de perfiles de acompa(?:ñ|&ntilde;)antes adultas independientes y escorts en Santiago/i);
  assert.equal((html.match(/<script[^>]+type="application\/ld\+json"/gi) ?? []).length, 1);
  assert.equal(websiteSchema['@context'], 'https://schema.org');
  assert.equal(websiteSchema['@type'], 'WebSite');
  assert.equal(websiteSchema.name, 'Paramours');
  assert.equal(websiteSchema.url, 'https://paramours.cl/');
  assert.equal(websiteSchema.description, description);
  assert.equal(websiteSchema.potentialAction, undefined);
  assert.match(html, /<meta property="og:title" content="Escorts en Santiago, Chile \| Paramours"/i);
  assert.match(html, new RegExp(`<meta property="og:description" content="${description}"`, 'i'));
  assert.match(html, /<meta property="og:image" content="https:\/\/paramours\.cl\/assets\/images\/logo-footer\.png"/i);
  assert.match(html, /<meta property="og:image:alt" content="Paramours - Escorts en Santiago"/i);
  assert.doesNotMatch(html, /<meta property="og:image:(?:width|height)"/i);
  assert.match(html, /<meta name="twitter:title" content="Escorts en Santiago, Chile \| Paramours"/i);
  assert.match(html, new RegExp(`<meta name="twitter:description" content="${description}"`, 'i'));
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"/i);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/paramours\.cl\/assets\/images\/logo-footer\.png"/i);
  assert.match(html, /<meta name="twitter:image:alt" content="Paramours - Escorts en Santiago"/i);
});
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

test('an active commune exposes complete on-page SEO and crawlable profile anchors in SSR', async () => {
  const homeHtml = await request('/').then(response => response.text());
  const communeAnchor = anchors(homeHtml).find(anchor => anchor.href.startsWith('/escort-') && anchor.href !== '/escort-santiago');
  assert.ok(communeAnchor);
  const communeName = communeAnchor.text.replace(/^Escorts en /, '');

  const response = await request(communeAnchor.href);
  const directoryHtml = await response.text();
  const title = directoryHtml.match(/<title>([^<]+)<\/title>/i)?.[1];
  const description = directoryHtml.match(/<meta name="description" content="([^"]+)"/i)?.[1];
  const canonical = directoryHtml.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  const robots = directoryHtml.match(/<meta name="robots" content="([^"]+)"/i)?.[1];
  const h1s = Array.from(directoryHtml.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi), match => match[1].replace(/<[^>]+>/g, '').trim());
  const h2s = Array.from(directoryHtml.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi), match => match[1].replace(/<[^>]+>/g, '').trim());
  const schema = JSON.parse(directoryHtml.match(/<script id="location-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1] ?? '{}');
  const collectionPage = schema['@graph']?.find(item => item['@type'] === 'CollectionPage');
  const breadcrumb = schema['@graph']?.find(item => item['@type'] === 'BreadcrumbList');
  const faqPage = schema['@graph']?.find(item => item['@type'] === 'FAQPage');
  const visibleQuestions = Array.from(directoryHtml.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/gi), match => match[1].replace(/<[^>]+>/g, '').trim());
  const expectedDescription = `Explora escorts en ${communeName} en Paramours. Revisa perfiles de acompañantes adultas independientes, información publicada y medios de contacto.`;

  assert.equal(response.status, 200);
  assert.equal(title, `Escorts en ${communeName}, Santiago | Paramours`);
  assert.equal(description, expectedDescription);
  assert.equal(canonical, `https://paramours.cl${communeAnchor.href}`);
  assert.equal(robots, 'index, follow, max-image-preview:large');
  assert.deepEqual(h1s, [`Escorts en ${communeName}`]);
  assert.ok(h2s.includes(`Perfiles disponibles en ${communeName}`));
  assert.match(directoryHtml, new RegExp(`Encuentra perfiles de escorts y acompañantes adultas independientes en ${communeName}, Santiago\\.`));
  assert.equal(collectionPage.name, title);
  assert.equal(collectionPage.description, description);
  assert.equal(collectionPage.url, canonical);
  assert.deepEqual(breadcrumb.itemListElement, [
    { '@type': 'ListItem', position: 1, name: 'Paramours', item: 'https://paramours.cl/' },
    { '@type': 'ListItem', position: 2, name: `Escorts en ${communeName}`, item: canonical }
  ]);
  assert.ok(visibleQuestions.length > 0);
  assert.deepEqual(faqPage.mainEntity.map(item => item.name), visibleQuestions);
  for (const entity of faqPage.mainEntity) {
    assert.match(directoryHtml, new RegExp(entity.acceptedAnswer.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.equal((directoryHtml.match(/<script[^>]+type="application\/ld\+json"/gi) ?? []).length, 1);
  assert.match(directoryHtml, new RegExp(`<meta property="og:title" content="${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'i'));
  assert.match(directoryHtml, /<meta property="og:image" content="https:\/\/paramours\.cl\/assets\/images\/logo-footer\.png"/i);
  assert.match(directoryHtml, new RegExp(`<meta property="og:image:alt" content="Escorts en ${communeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} - Paramours"`, 'i'));
  assert.match(directoryHtml, /<meta name="twitter:image" content="https:\/\/paramours\.cl\/assets\/images\/logo-footer\.png"/i);
  assert.match(directoryHtml, new RegExp(`<meta name="twitter:image:alt" content="Escorts en ${communeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} - Paramours"`, 'i'));
  assert.doesNotMatch(directoryHtml, /<meta property="og:image:(?:width|height)"/i);
  assert.match(directoryHtml, new RegExp(`<meta name="twitter:description" content="${description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'i'));

  const profileAnchors = anchors(directoryHtml).filter(anchor => anchor.href.startsWith('/profile/'));
  assert.ok(profileAnchors.length > 0);
  assert.ok(profileAnchors.every(anchor => /^\/profile\/\d+\/[^/]+$/.test(anchor.href)));
});

test('a valid empty commune stays 200/noindex and outside the sitemap', async () => {
  const [sitemapXml, communesJson] = await Promise.all([
    request('/sitemap.xml').then(response => response.text()),
    readFile('public/assets/data/comunas.json', 'utf8')
  ]);
  const communes = JSON.parse(communesJson);
  const emptyCommune = communes.find(commune => !sitemapXml.includes(`<loc>https://paramours.cl/escort-${commune.slug}</loc>`));
  assert.ok(emptyCommune);

  const response = await request(`/escort-${emptyCommune.slug}`);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<meta name="robots" content="noindex, follow"/i);
  assert.doesNotMatch(sitemapXml, new RegExp(`<loc>https://paramours\\.cl/escort-${emptyCommune.slug}</loc>`));
});
test('an active public profile exposes complete on-page SEO and its commune link in SSR', async () => {
  const homeHtml = await request('/').then(response => response.text());
  const communeAnchor = anchors(homeHtml).find(anchor => anchor.href.startsWith('/escort-') && anchor.href !== '/escort-santiago');
  assert.ok(communeAnchor);
  const communeName = communeAnchor.text.replace(/^Escorts en /, '');
  const directoryHtml = await request(communeAnchor.href).then(response => response.text());
  const profileHref = anchors(directoryHtml).find(anchor => anchor.href.startsWith('/profile/'))?.href;
  assert.ok(profileHref);

  const response = await request(profileHref);
  const html = await response.text();
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  const robots = html.match(/<meta name="robots" content="([^"]+)"/i)?.[1];
  const h1s = Array.from(html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi), match => match[1].replace(/<[^>]+>/g, '').trim());
  const schema = JSON.parse(html.match(/<script id="profile-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1] ?? '{}');
  const profileName = schema.mainEntity?.name;
  const expectedTitle = `${profileName} - Escort en ${communeName}, Santiago | Paramours`;
  const expectedDescription = `Conoce el perfil de ${profileName}, escort en ${communeName}, Santiago. Revisa la información publicada, disponibilidad y medios de contacto en Paramours.`;

  assert.equal(response.status, 200);
  assert.equal(robots, 'index, follow, max-image-preview:large');
  assert.equal(title, expectedTitle);
  assert.equal(description, expectedDescription.length <= 160 ? expectedDescription : `${expectedDescription.slice(0, 159).trim()}...`);
  assert.equal(canonical, `https://paramours.cl${profileHref}`);
  assert.deepEqual(h1s, [`${profileName}, Escort en ${communeName}`]);
  assert.ok(anchors(html).some(anchor => anchor.href === communeAnchor.href && anchor.text === `Escorts en ${communeName}`));
  assert.equal(schema['@type'], 'ProfilePage');
  assert.equal(schema.name, title);
  assert.equal(schema.url, canonical);
  assert.equal(schema.mainEntity['@type'], 'Person');
  assert.equal(schema.mainEntity.name, profileName);
  assert.equal(schema.mainEntity.description, description);
  assert.equal(schema.breadcrumb['@type'], 'BreadcrumbList');
  assert.deepEqual(schema.breadcrumb.itemListElement, [
    { '@type': 'ListItem', position: 1, name: 'Paramours', item: 'https://paramours.cl/' },
    { '@type': 'ListItem', position: 2, name: `Escorts en ${communeName}`, item: `https://paramours.cl${communeAnchor.href}` },
    { '@type': 'ListItem', position: 3, name: profileName, item: canonical }
  ]);
  assert.equal((html.match(/<script[^>]+type="application\/ld\+json"/gi) ?? []).length, 1);
  const hasPublicProfileImage = !schema.mainEntity.image.endsWith('/avatar_anunciante.png');
  const expectedSocialImage = hasPublicProfileImage ? schema.mainEntity.image : 'https://paramours.cl/assets/images/logo-footer.png';
  const escapedSocialImage = expectedSocialImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedSocialAlt = `${profileName} en ${communeName}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(html, new RegExp(`<meta property="og:image" content="${escapedSocialImage}"`, 'i'));
  assert.match(html, new RegExp(`<meta property="og:image:alt" content="${escapedSocialAlt}"`, 'i'));
  assert.match(html, new RegExp(`<meta name="twitter:image" content="${escapedSocialImage}"`, 'i'));
  assert.match(html, new RegExp(`<meta name="twitter:image:alt" content="${escapedSocialAlt}"`, 'i'));
  assert.match(html, new RegExp(`<meta property="og:url" content="${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'i'));
  assert.match(html, new RegExp(`<meta name="twitter:title" content="${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'i'));
});

test('a valid profile with an incorrect slug redirects permanently to the official URL', async () => {
  const homeHtml = await request('/').then(response => response.text());
  const officialHref = anchors(homeHtml).find(anchor => anchor.href.startsWith('/profile/'))?.href;
  assert.ok(officialHref);
  const [, , id] = officialHref.split('/');
  const incorrectHref = `/profile/${id}/slug-incorrecto-auditoria`;

  const response = await request(incorrectHref);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), officialHref);
});
