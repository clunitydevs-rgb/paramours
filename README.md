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
- Valid empty landing pages and geographic directories remain HTTP 200 with `noindex`.
  Essential data unavailability returns HTTP 503 during SSR, without automatically adding
  `noindex`. The dynamic sitemap includes only configured indexable pages with matching
  active profiles. The static fallback remains conservative.
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

## Estado de implementación: cierre de Fase 1

Certificación local del **27 de noviembre de 2026: APROBADO**.

### Trabajo terminado

- **H01:** cargas de perfil asociadas al ID de la ruta, cancelación de solicitudes
  anteriores, comprobación de identidad y limpieza del estado y contenido dependiente.
- **H02:** distinción entre datos válidos, recurso inexistente (404), directorio válido
  vacío (200/noindex) e indisponibilidad esencial (503 SSR). Los errores de la consulta
  previa de Express no provocan una segunda consulta contradictoria en Angular.
- **H13:** conservación del SEO inicial, transferencia explícita de datos públicos y
  ausencia de consultas críticas redundantes durante la hidratación verificada.
- Categoría del H1 calculada desde el perfil vigente, sin heredar la anterior.
- Test de Caldera corregido: distingue ciudades y comunas mediante sus catálogos y
  ciudad padre; selecciona la comuna de forma independiente del orden de los enlaces.
  El comportamiento geográfico de Angular y sus textos permanecen intactos.
- Revisión de los 27 archivos originales y del test adicional de cierre. Se corrigieron
  el refresco de perfiles inactivos para la vista administrativa, la liberación del
  temporizador/listener del Home y la proyección mínima del catálogo en TransferState.

### Evidencia de certificación

| Grupo | Aprobadas | Fallidas | Omitidas |
| --- | ---: | ---: | ---: |
| Suite SEO | 66 | 0 | 0 |
| Fase 1, routing y servicios | 51 | 0 | 0 |
| SSR, hidratación y navegador controlado | 11 | 0 | 0 |
| Integraciones existentes | 62 | 0 | 0 |
| **Total** | **190** | **0** | **0** |

El build de producción terminó correctamente y fue generado después de las fuentes
de ejecución utilizadas. Se comprobaron las **61 URL** del sitemap público de esa
captura contra el build local con APIs reales: HTTP, canonical, robots, title,
description, `og:url`, H1 y JSON-LD coincidieron. La cantidad de URL puede cambiar.

Las pruebas de errores y navegador usan fixtures controlados; los fallos de API son
inducidos. No se modificó CORS productivo. La certificación corresponde a las suites
indicadas y al build local, no a un despliegue ni a toda la colección genérica de
scaffolds de `npm test`.

Los comandos reproducibles de Fase 1 son:

```sh
npm run build
npm run test:seo
npm run test:phase1
npm run test:ssr-phase1
```

Configurar `CHROME_BIN` con Chrome, Chromium o Edge compatible para ejecutar los casos
de navegador. Las integraciones SSR requieren un build actualizado antes de iniciarse.
El registro completo, las demás integraciones ejecutadas, el inventario de archivos y
las trazas se conservan como **artefactos locales no versionados**:

- [Informe de cierre](.audit-tmp/phase1-closure/informe.html).
- [Resultados e inventario](.audit-tmp/phase1-closure/results.json).
- [Revisión de Git y huella del build](.audit-tmp/phase1-closure/review.json).
- [Comandos y procedencia de las pruebas](.audit-tmp/phase1-closure/commands.txt).

### Trabajo pendiente y límites

No quedan correcciones de implementación ni pruebas pendientes dentro del cierre
certificado de Fase 1. La reanudación posterior al límite de uso actualizó únicamente
esta documentación, sin repetir pruebas aprobadas ni modificar código de ejecución.

Quedan fuera de este cierre:

- **Fase 2:** estrategia de descripciones, contenido geográfico y decisiones editoriales
  de consolidación. No está implementada ni autorizada por la reanudación de Fase 1.
- Publicación en producción, que requiere una decisión posterior. No se desplegó ni
  se generaron commits.
- Validación operativa del backend autenticado completo y de acciones administrativas
  reales después de una eventual publicación. Las reglas y endpoints de autenticación
  permanecen sin cambios; las pruebas de propietario, administrador y visitante usan
  datos controlados y no escriben en producción.

No se modificaron las descripciones de anunciantes, los textos geográficos, las
dependencias, la base de datos, las APIs, la infraestructura ni GitHub Actions.
