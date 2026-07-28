process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

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
