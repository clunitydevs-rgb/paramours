import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'account/:typeuser',
    renderMode: RenderMode.Server
  },
  {
    path: 'profile/:sUid/:sLug',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
