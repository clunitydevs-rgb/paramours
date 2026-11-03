# ClAppParamours

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


## SEO landing pages

`src/app/seo-pages/seo-pages.config.ts` is the shared configuration for the 12 landing pages.
It defines route content, canonical paths, indexability and optional geographic scope.
`SeoPage` hosts the existing `Home` component with this configuration; it reuses the same
catalog API, profile cards, responsive stylesheet, stories viewer and profile links.
The unconfigured Home and the existing commune directory retain their own content and SEO.

- The four legacy entry pages use Paramours-only headings, descriptions and social metadata,
  with no comparison section. `/gemidos-tv/` and `/gemidos-tv` render the same full catalog;
  the original `/gemidos-tv/chile` remains available with canonical `/gemidos-tv/`.
  Only the canonical URL is added to the sitemap. The four identical landing pages retain
  their existing indexability policy; identical content under different self-canonical URLs
  can be treated as duplicate content by search engines.
- `/sexo-santiago`, `/sexo-providencia` and `/sexo-las-condes` filter the catalog and stories
  using the city/commune hierarchy. Geographic matching is shared with the sitemap.
- `/escort` and `/escorts` remain HTTP 200, with `noindex, follow` and canonical
  `/escorts-chile`. The other pages have their own canonical, including `/locanto-cl/`.
- Empty or unavailable catalogs are `noindex`; the dynamic sitemap includes only
  configured indexable pages with matching active profiles. The static fallback remains conservative.
- Exact routes precede the geographic matcher; Express exempts the configured
  `/escorts-chile` page from its existing legacy redirect. Unknown pages use the existing SSR 404.
- WebVisits accepts each configured route and preserves its requested path. GA4 keeps
  the existing global navigation tracking.

Validation:

```sh
npm run build
npm run test:seo
npm run test:ssr-seo
npm run test:analytics
```

`test:seo` requires Chrome/Chromium; set `CHROME_BIN` when using another compatible binary.
`test:ssr-seo` requires the build and uses a fetch fixture in the child server process
so catalog, location and sitemap checks are deterministic and do not use production APIs.
It covers all 12 URLs, SSR metadata, canonical/robots, catalog filtering, 404s and legacy routes.
Browser tests additionally cover SPA navigation, story filtering/viewer and WebVisits.
