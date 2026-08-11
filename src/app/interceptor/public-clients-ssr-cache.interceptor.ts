import { isPlatformServer } from '@angular/common';
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { from, map } from 'rxjs';
import { PUBLIC_CLIENTS_URL, publicClientsCache } from '../../public-clients-cache';

export const publicClientsSsrCacheInterceptor: HttpInterceptorFn = (request, next) => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformServer(platformId) || request.method !== 'GET' || request.url !== PUBLIC_CLIENTS_URL) {
    return next(request);
  }

  return from(publicClientsCache.get(async () => {
    const response = await fetch(PUBLIC_CLIENTS_URL, {
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      throw new Error(`Clients API returned ${response.status}`);
    }

    return response.json();
  })).pipe(
    map(body => new HttpResponse({ body, status: 200, url: request.url }))
  );
};