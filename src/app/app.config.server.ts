import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { BLOG_API_BASE } from './service/blog.service';
import { BLOG_API_URL } from './models/blog.interface';

const serverConfig: ApplicationConfig = {
  providers: [
    { provide: BLOG_API_BASE, useFactory: () => process.env['PARAMOURS_BLOG_API_URL'] || BLOG_API_URL },
    provideServerRendering(withRoutes(serverRoutes))
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
