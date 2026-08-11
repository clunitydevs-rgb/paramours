import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { jtwInterceptor } from './interceptor/jwt.interceptor';
import { ApiInterceptor } from './interceptor/api.interceptor';
import { publicClientsSsrCacheInterceptor } from './interceptor/public-clients-ssr-cache.interceptor';
import localeEsCL from '@angular/common/locales/es-CL';
import { registerLocaleData } from '@angular/common';

registerLocaleData(localeEsCL);

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch(), withInterceptors([jtwInterceptor, publicClientsSsrCacheInterceptor]), withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi:true },
    { provide: LOCALE_ID, useValue: 'es-CL' },
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'top',
      anchorScrolling: 'enabled'
    })),
    provideClientHydration(withEventReplay())
  ]
};
