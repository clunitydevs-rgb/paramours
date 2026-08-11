import { RESPONSE_INIT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SsrResponseService } from './ssr-response.service';

describe('SsrResponseService', () => {
  it('sets the SSR response status to 404', () => {
    const responseInit: ResponseInit = { status: 200 };
    TestBed.configureTestingModule({
      providers: [
        SsrResponseService,
        { provide: RESPONSE_INIT, useValue: responseInit }
      ]
    });

    TestBed.inject(SsrResponseService).setNotFound();

    expect(responseInit.status).toBe(404);
  });

  it('is safe when no SSR response exists in the browser', () => {
    TestBed.configureTestingModule({ providers: [SsrResponseService] });
    expect(() => TestBed.inject(SsrResponseService).setNotFound()).not.toThrow();
  });
});