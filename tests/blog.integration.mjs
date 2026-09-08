import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import test from 'node:test';

const slug = 'primera-vez-contratando-una-escort-en-chile';
const post = {
  id: 1, slug, title: 'Guía de prueba', metaTitle: 'Título SEO de prueba | Paramours',
  metaDescription: 'Descripción SEO de prueba.', summary: 'Resumen de prueba.',
  content: '<p>Contenido SSR del artículo.</p><h2>Información</h2><ul><li>Detalle</li></ul><img src="x" onerror="alert(1)"><script>alert(1)</script>',
  featuredImage: null, featuredImageAlt: 'Imagen de prueba', author: 'Paramours',
  status: 'V', isActive: true, isIndexable: true,
  publishedDate: '2026-09-08T17:13:04.39', modifiedDate: '2026-09-09T17:13:04.39', createdDate: '2026-09-08T17:13:04.39'
};
const posts = [post,
  { ...post, id: 2, slug: 'noindex', isIndexable: false, metaTitle: '', featuredImage: 'https://paramours.cl/test.jpg' },
  { ...post, id: 3, slug: 'inactivo', isActive: false },
  { ...post, id: 4, slug: 'borrador', status: 'B' }
];
let listFailure = false;
const calls = [];
let app;
let origin;
const api = createServer(async (req, res) => {
  let body = '';
  for await (const chunk of req) body += chunk;
  calls.push({ method: req.method, path: req.url, body });
  const requested = body ? JSON.parse(body).sSlug : '';
  if (requested === 'error-api' || (listFailure && req.method === 'GET')) {
    res.writeHead(503); res.end(); return;
  }
  res.setHeader('content-type', 'application/json');
  const value = req.method === 'GET' ? posts : posts.find(item => item.slug === requested) || null;
  res.end(JSON.stringify({ oBlog: value, ncoderror: value ? 0 : 1, message: '' }));
});
async function request(path) {
  return fetch(`${origin}${path}`, { headers: { host: 'paramours.cl' }, redirect: 'manual' });
}
const schemas = html => [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
test.before(async () => {
  await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
  const port = 4349;
  origin = `http://127.0.0.1:${port}`;
  app = spawn(process.execPath, ['dist/cl.app.paramours/server/server.mjs'], {
    env: { ...process.env, PORT: String(port), PARAMOURS_BLOG_API_URL: `http://127.0.0.1:${api.address().port}/Blog` },
    stdio: 'ignore', windowsHide: true
  });
  for (let i = 0; i < 60; i++) {
    try { await request('/home'); return; } catch { await new Promise(resolve => setTimeout(resolve, 250)); }
  }
  throw new Error('SSR server did not start');
});
test.after(async () => { app?.kill(); await new Promise(resolve => api.close(resolve)); });

test('blog list renders published posts, crawlable links and canonical without parameters in SSR', async () => {
  const response = await request('/blog?utm_source=test');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<h1[^>]*>Guías y consejos<\/h1>/);
  assert.match(html, /<meta name="robots" content="index, follow"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/paramours.cl\/blog"/);
  assert.ok(html.includes(`href="/blog/${slug}"`));
  assert.ok(html.includes('href="/blog/noindex"'));
  assert.ok(!html.includes('href="/blog/inactivo"'));
  assert.ok(!html.includes('href="/blog/borrador"'));
});

test('article renders full SEO, sanitized HTML, schemas and transfer state in the initial response', async () => {
  calls.length = 0;
  const response = await request(`/blog/${slug}?utm_source=test`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes(`<title>${post.metaTitle}</title>`));
  assert.ok(html.includes(`name="description" content="${post.metaDescription}"`));
  assert.ok(html.includes(`rel="canonical" href="https://paramours.cl/blog/${slug}"`));
  assert.match(html, /<meta name="robots" content="index, follow"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<p>Contenido SSR del artículo.<\/p><h2>Información<\/h2>/);
  assert.doesNotMatch(html, /<img[^>]*onerror=/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /property="og:type" content="article"/);
  assert.match(html, /property="og:image" content="https:\/\/paramours.cl\/assets\/images\/logo-footer.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  const structured = schemas(html);
  assert.equal(structured.filter(item => item['@type'] === 'Article').length, 1);
  const article = structured.find(item => item['@type'] === 'Article');
  assert.equal(article.dateModified, post.modifiedDate);
  assert.equal(article.headline, post.title);
  assert.equal(structured.find(item => item['@type'] === 'BreadcrumbList').itemListElement.length, 3);
  assert.ok(html.includes(`blog:post:${slug}`));
  assert.equal(calls.filter(call => call.path.endsWith('/GetBlogBySlug')).length, 1);
  assert.deepEqual(JSON.parse(calls.find(call => call.path.endsWith('/GetBlogBySlug')).body), { sSlug: slug });
  assert.match(html, /href="\/escort-santiago"/);
});

test('noindex article stays accessible and uses title fallback and featured social image', async () => {
  const response = await request('/blog/noindex');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<meta name="robots" content="noindex, follow"/);
  assert.ok(html.includes(`<title>${post.title} | Paramours</title>`));
  assert.match(html, /property="og:image" content="https:\/\/paramours.cl\/test.jpg"/);
});

for (const missing of ['articulo-que-no-existe', 'inactivo', 'borrador']) {
  test(`${missing} returns real 404 without canonical or Article schema`, async () => {
    const response = await request(`/blog/${missing}`);
    assert.equal(response.status, 404);
    const html = await response.text();
    assert.match(html, /name="robots" content="noindex, follow"/);
    assert.doesNotMatch(html, /rel="canonical"/);
    assert.equal(schemas(html).length, 0);
  });
}

test('upstream failures return 503 instead of false 404 or indexable empty pages', async () => {
  const response = await request('/blog/error-api');
  assert.equal(response.status, 503);
  assert.match(await response.text(), /name="robots" content="noindex, follow"/);
  listFailure = true;
  try { assert.equal((await request('/blog')).status, 503); } finally { listFailure = false; }
});

test('dynamic sitemap includes only indexable published blogs and their modified date', async () => {
  const response = await request('/sitemap.xml');
  assert.equal(response.status, 200);
  const xml = await response.text();
  assert.ok(xml.includes('<loc>https://paramours.cl/blog</loc>'));
  assert.ok(xml.includes(`<loc>https://paramours.cl/blog/${slug}</loc>\n    <lastmod>2026-09-09</lastmod>`));
  for (const excluded of ['noindex', 'inactivo', 'borrador']) assert.ok(!xml.includes(`/blog/${excluded}`));
});
