import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { WEB_VISITS_REGISTER_URL } from '../api/web-visits.config';
import { WebVisitService } from './web-visit.service';

describe('WebVisitService', () => {
  let service: WebVisitService;
  let http: HttpTestingController;
  let events: Subject<NavigationEnd>;
  const storageKey = 'paramours.webVisits.paths';

  beforeEach(() => {
    sessionStorage.removeItem(storageKey);
    events = new Subject<NavigationEnd>();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: Router, useValue: { events, navigated: false, url: '/' } }
      ]
    });
    service = TestBed.inject(WebVisitService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.removeItem(storageKey);
  });

  it('registers allowed paths independently, normalizes queries/fragments and deduplicates pending and successful visits', () => {
    for (const path of ['/', '/escort-santiago', '/profile/x', '/profile/j', '/blog/article']) {
      service.register(`${path}?source=test#section`);
      service.register(path);
      const request = http.expectOne(WEB_VISITS_REGISTER_URL);
      expect(request.request.method).toBe('POST');
      expect(request.request.headers.get('X-Page-Path')).toBe(path);
      expect(request.request.body).toEqual({ eventType: 'PAGE_VIEW' });
      expect(JSON.parse(sessionStorage.getItem(storageKey) ?? '[]')).not.toContain(path);
      request.flush(null, { status: 204, statusText: 'No Content' });
      expect(JSON.parse(sessionStorage.getItem(storageKey)!)).toContain(path);
      service.register(path);
      http.expectNone(WEB_VISITS_REGISTER_URL);
    }
  });

  it('ignores routes outside the allowlist', () => {
    for (const path of ['/assets/image.png', '/api/v1/test', '/admin', '/login', '/blog', '/profile', '/escort-', '/other']) {
      service.register(path);
    }
    http.expectNone(WEB_VISITS_REGISTER_URL);
  });

  it('allows retrying after a failed request', () => {
    service.register('/profile/x');
    http.expectOne(WEB_VISITS_REGISTER_URL).flush('', { status: 500, statusText: 'Error' });
    expect(sessionStorage.getItem(storageKey)).toBeNull();
    service.register('/profile/x');
    http.expectOne(WEB_VISITS_REGISTER_URL).flush('ok');
  });

  it('honors persisted visits and allows registration in a fresh session', () => {
    sessionStorage.setItem(storageKey, JSON.stringify(['/profile/x']));
    service.register('/profile/x');
    http.expectNone(WEB_VISITS_REGISTER_URL);
    sessionStorage.removeItem(storageKey);
    service.register('/profile/x');
    http.expectOne(WEB_VISITS_REGISTER_URL).flush('ok');
  });

  it('subscribes once and uses the final URL for initial and internal navigations', () => {
    service.start();
    service.start();
    events.next(new NavigationEnd(1, '/home', '/'));
    http.expectOne(WEB_VISITS_REGISTER_URL).flush('ok');
    events.next(new NavigationEnd(2, '/profile/x', '/profile/x'));
    http.expectOne(WEB_VISITS_REGISTER_URL).flush('ok');
  });

  it('covers an initial navigation completed before startup', () => {
    const router = TestBed.inject(Router);
    router.navigated = true;
    service.start();
    http.expectOne(WEB_VISITS_REGISTER_URL).flush('ok');
  });

  it('continues when storage is malformed or unavailable', () => {
    sessionStorage.setItem(storageKey, 'invalid');
    spyOn(Storage.prototype, 'setItem').and.throwError('Storage blocked');
    service.register('/');
    http.expectOne(WEB_VISITS_REGISTER_URL).flush('ok');
    service.register('/');
    http.expectNone(WEB_VISITS_REGISTER_URL);
  });

  it('does not access storage or send requests during SSR', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      { provide: PLATFORM_ID, useValue: 'server' },
      { provide: Router, useValue: { events, navigated: true, url: '/' } }
    ] });
    const storage = spyOn(Storage.prototype, 'getItem').and.throwError('Browser-only API');
    service = TestBed.inject(WebVisitService);
    http = TestBed.inject(HttpTestingController);
    service.start();
    service.register('/');
    service.registerEvent('CLICK_WHATSAPP', '/profile/10/fran');
    service.registerEvent('CLICK_PHONE', '/profile/10/fran');
    expect(storage).not.toHaveBeenCalled();
    http.expectNone(WEB_VISITS_REGISTER_URL);
  });

  for (const eventType of ['CLICK_WHATSAPP', 'CLICK_PHONE'] as const) {
    it(`sends every ${eventType} click without reading or writing sessionStorage`, () => {
      const read = spyOn(Storage.prototype, 'getItem').and.throwError('Must not read storage');
      const write = spyOn(Storage.prototype, 'setItem').and.throwError('Must not write storage');
      const url = 'https://paramours.cl/profile/10/fran?utm_source=x#detalle';
      service.registerEvent(eventType, url);
      service.registerEvent(eventType, url);
      const requests = http.match(WEB_VISITS_REGISTER_URL);
      expect(requests.length).toBe(2);
      for (const request of requests) {
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({ eventType });
        expect(request.request.headers.get('X-Page-Path')).toBe('/profile/10/fran');
        request.flush('ok');
      }
      service.registerEvent(eventType, '/profile/10/fran?x=1#detalle');
      http.expectOne(WEB_VISITS_REGISTER_URL).flush('ok');
      expect(read).not.toHaveBeenCalled();
      expect(write).not.toHaveBeenCalled();
    });

    it(`silently handles ${eventType} failures and keeps subsequent clicks independent`, () => {
      service.registerEvent(eventType, '/profile/10/fran');
      expect(() => http.expectOne(WEB_VISITS_REGISTER_URL).flush('', {
        status: 500, statusText: 'Error'
      })).not.toThrow();
      service.registerEvent(eventType, '/profile/10/fran');
      http.expectOne(WEB_VISITS_REGISTER_URL).flush('ok');
      expect(sessionStorage.getItem(storageKey)).toBeNull();
    });
  }

  it('normalizes absolute PAGE_VIEW URLs and keeps clicks independent of page deduplication', () => {
    const path = '/profile/10/fran';
    service.register(`https://paramours.cl${path}?utm_source=x#detalle`);
    service.registerEvent('CLICK_PHONE', path);
    const requests = http.match(WEB_VISITS_REGISTER_URL);
    expect(requests.length).toBe(2);
    requests[1].flush('ok');
    service.register(path);
    http.expectNone(WEB_VISITS_REGISTER_URL);
    expect(requests[0].request.headers.get('X-Page-Path')).toBe(path);
    requests[0].flush('ok');
    service.register(path);
    http.expectNone(WEB_VISITS_REGISTER_URL);
    service.registerEvent('CLICK_WHATSAPP', path);
    http.expectOne(WEB_VISITS_REGISTER_URL).flush('ok');
  });
});
