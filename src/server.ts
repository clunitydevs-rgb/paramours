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
import { buildSitemapXml } from './sitemap';
import type { SitemapLocation, SitemapProfile } from './sitemap';
import type { ProfileRequestContext } from './app/models/profile-request-context';
import type { ResponseClient } from './app/models/response.interface';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
const profileApiUrl = process.env['PARAMOURS_PROFILE_API_URL']
  || 'https://cl.api.client.paramours.cl/api/v1/Client/ClientById';

interface ProfileCanonicalPayload {
  ncoderror?: string | number;
  oClient?: {
    iD_USUARIO?: string | number;
    nombrE_USUARIO?: string;
    slug?: string;
  };
}

function buildOfficialProfilePath(profile: NonNullable<ProfileCanonicalPayload['oClient']>): string | null {
  const id = profile.iD_USUARIO?.toString().trim() ?? '';
  const slug = String(profile.slug || `Escort-${profile.nombrE_USUARIO || ''}`)
    .replace(/[\r\n]/g, '')
    .trim();

  if (!id || !slug) return null;
  const encodedSlug = encodeURIComponent(slug).replace(/%2F/gi, '-');
  return `/profile/${encodeURIComponent(id)}/${encodedSlug}`;
}

app.use(async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    next();
    return;
  }

  const profileMatch = req.path.match(/^\/profile\/(\d+)(?:\/([^/]*))?\/?$/);
  if (!profileMatch) {
    next();
    return;
  }

  const requestedId = profileMatch[1];
  let requestedSlug: string;
  try {
    requestedSlug = decodeURIComponent(profileMatch[2] ?? '');
  } catch {
    next();
    return;
  }

  try {
    const profileResponse = await fetch(profileApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sUid: Number(requestedId) }),
      signal: AbortSignal.timeout(6000),
    });

    if (!profileResponse.ok) {
      next();
      return;
    }

    const payload = await profileResponse.json() as ProfileCanonicalPayload;
    res.locals['profileRequestContext'] = {
      profileLookup: {
        requestedId: Number(requestedId),
        response: payload as ResponseClient,
      },
    } satisfies ProfileRequestContext;
    const profile = String(payload.ncoderror) === '0' ? payload.oClient : undefined;
    const officialPath = profile ? buildOfficialProfilePath(profile) : null;
    if (!officialPath) {
      next();
      return;
    }

    const officialSlug = decodeURIComponent(officialPath.split('/').at(-1)!);
    const hasTrailingSlash = req.path.endsWith('/');
    if (requestedSlug === officialSlug && !hasTrailingSlash) {
      next();
      return;
    }

    const forwardedHost = req.headers['x-forwarded-host'];
    const rawHost = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.headers.host || '';
    const host = rawHost.split(',')[0].trim().split(':')[0].toLowerCase();
    res.redirect(301, host === 'www.paramours.cl' ? `https://paramours.cl${officialPath}` : officialPath);
  } catch (error) {
    console.error('Failed to resolve the canonical profile slug.', error);
    next();
  }
});

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

    const payload = await clientsResponse.json() as { oClient?: SitemapProfile[] };
    const profiles = Array.isArray(payload.oClient) ? payload.oClient : [];
    const communes = JSON.parse(communesJson) as SitemapLocation[];
    const cities = JSON.parse(citiesJson) as SitemapLocation[];

    res.type('application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    res.send(buildSitemapXml(profiles, communes, cities));
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
  const requestContext = res.locals['profileRequestContext'] as ProfileRequestContext | undefined;
  angularApp
    .handle(req, requestContext)
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
