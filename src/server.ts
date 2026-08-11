process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use((req, res, next) => {
  const forwardedHost = req.headers['x-forwarded-host'];
  const rawHost = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.headers.host || '';
  const host = rawHost.split(',')[0].trim().split(':')[0].toLowerCase();

  if (host === 'www.paramours.cl') {
    const targetUrl = req.path === '/home' ? 'https://paramours.cl/' : `https://paramours.cl${req.originalUrl}`;
    res.redirect(301, targetUrl);
    return;
  }

  next();
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

const legacyLocationRoutes = new Map<string, string>([
  ['/escorts-santiago', '/escort-santiago'],
  ['/escorts-santiago-centro', '/escort-santiago-centro'],
  ['/escorts-santiago-providencia', '/escort-providencia'],
  ['/escorts-santiago-las-condes', '/escort-las-condes'],
  ['/escorts-santiago-la-reina', '/escort-la-reina'],
  ['/escorts-santiago-las-reina', '/escort-la-reina'],
  ['/escorts-santiago-san-miguel', '/escort-san-miguel'],
  ['/escorts-santiago-lo-prado', '/escort-lo-prado'],
]);

app.get([...legacyLocationRoutes.keys()], (req, res) => {
  res.redirect(301, legacyLocationRoutes.get(req.path)!);
});

app.get('/escorts-:slug', (req, res) => {
  res.redirect(301, `/escort-${req.params.slug}`);
});

app.get('/home', (_req, res) => {
  res.redirect(301, 'https://paramours.cl/');
});

app.get('/sitemap.xml', async (_req, res) => {
  try {
    const [clientsResponse, communesJson, citiesJson] = await Promise.all([
      fetch('https://cl.api.client.paramours.cl/api/v1/Client/GetClients', {
        signal: AbortSignal.timeout(6000),
      }),
      readFile(join(browserDistFolder, 'assets/data/comunas.json'), 'utf8'),
      readFile(join(browserDistFolder, 'assets/data/ciudades.json'), 'utf8'),
    ]);

    if (!clientsResponse.ok) throw new Error(`Clients API returned ${clientsResponse.status}`);

    const payload = await clientsResponse.json() as { oClient?: Array<Record<string, unknown>> };
    const profiles = Array.isArray(payload.oClient) ? payload.oClient : [];
    const communes = JSON.parse(communesJson) as Array<{ id: string | number; slug: string }>;
    const cities = JSON.parse(citiesJson) as Array<{ id: string | number; slug: string }>;
    const activeCommuneIds = new Set(profiles.map(profile => String(profile['comuna'] ?? '')));
    const activeCityIds = new Set(profiles.map(profile => String(profile['ciudad'] ?? '')));
    const today = new Date().toISOString().slice(0, 10);
    const urls = new Set<string>(['https://paramours.cl/']);

    for (const city of cities) {
      if (city.slug && activeCityIds.has(String(city.id))) urls.add(`https://paramours.cl/escort-${city.slug}`);
    }
    for (const commune of communes) {
      if (commune.slug && activeCommuneIds.has(String(commune.id))) urls.add(`https://paramours.cl/escort-${commune.slug}`);
    }
    for (const profile of profiles) {
      const id = profile['iD_USUARIO'];
      const slug = String(profile['slug'] || `Escort-${profile['nombrE_USUARIO'] || ''}`)
        .trim()
        .replaceAll(String.fromCharCode(13), '')
        .replaceAll(String.fromCharCode(10), '');
      if (id && slug) urls.add(`https://paramours.cl/profile/${id}/${encodeURIComponent(slug).replace(/%2F/gi, '-')}`);
    }

    const entries = [...urls].map((url, index) => `  <url>
    <loc>${url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${index === 0 ? '1.0' : '0.9'}</priority>
  </url>`).join(String.fromCharCode(10, 10));

    res.type('application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`);
  } catch (error) {
    console.error('Failed to generate dynamic sitemap.', error);
    res.sendFile(join(browserDistFolder, 'sitemap.xml'));
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
    setHeaders: (res, filePath) => {
      if (/[\\/](llms\.txt|robots\.txt|sitemap\.xml)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
      }
    },
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
