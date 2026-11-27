import { isPlatformServer } from '@angular/common';
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { of, tap } from 'rxjs';

export const publicAssetsTransferInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.method !== 'GET' || !/^\/assets\/data\/[a-z]+\.json$/.test(request.url)) return next(request);
  const state = inject(TransferState);
  const server = isPlatformServer(inject(PLATFORM_ID));
  const key = makeStateKey<unknown>(`public-asset:${request.url}`);
  if (!server && state.hasKey(key)) {
    const body = state.get(key, null);
    state.remove(key);
    return of(new HttpResponse({ body, status: 200, url: request.url }));
  }
  return next(request).pipe(tap(event => {
    if (server && event instanceof HttpResponse) state.set(key, event.body);
  }));
};
