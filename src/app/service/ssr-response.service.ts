import { Inject, Injectable, Optional, RESPONSE_INIT } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SsrResponseService {
  constructor(@Optional() @Inject(RESPONSE_INIT) private responseInit: ResponseInit | null) { }

  setNotFound(): void {
    if (this.responseInit) {
      this.responseInit.status = 404;
    }
  }
}