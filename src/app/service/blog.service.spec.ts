import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BLOG_API_URL } from '../models/blog.interface';
import { BlogService } from './blog.service';

describe('BlogService SSR hydration', () => {
  const response = { oBlog: null, message: 'No encontrado', ncoderror: 1 };
  function configure(platform: string) {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      { provide: PLATFORM_ID, useValue: platform }] });
    return { service: TestBed.inject(BlogService), http: TestBed.inject(HttpTestingController), state: TestBed.inject(TransferState) };
  }

  it('sends the slug as POST JSON and transfers the result on the server', () => {
    const { service, http, state } = configure('server');
    service.getBlogBySlug('prueba').subscribe(value => expect(value).toEqual(response));
    const request = http.expectOne(`${BLOG_API_URL}/GetBlogBySlug`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ sSlug: 'prueba' });
    request.flush(response);
    expect(state.get(makeStateKey<typeof response | null>('blog:post:prueba'), null)).toEqual(response);
    http.verify();
  });

  it('uses SSR data once during hydration, then fetches fresh data on later navigation', () => {
    const { service, http, state } = configure('browser');
    state.set(makeStateKey<typeof response>('blog:post:prueba'), response);
    service.getBlogBySlug('prueba').subscribe(value => expect(value).toEqual(response));
    http.expectNone(`${BLOG_API_URL}/GetBlogBySlug`);
    service.getBlogBySlug('prueba').subscribe();
    http.expectOne(`${BLOG_API_URL}/GetBlogBySlug`).flush(response);
    http.verify();
  });

  it('retrieves the list with GET', () => {
    const { service, http } = configure('server');
    service.getBlogs().subscribe();
    const request = http.expectOne(`${BLOG_API_URL}/GetBlogs`);
    expect(request.request.method).toBe('GET');
    request.flush({ oBlog: [], ncoderror: 0, message: '' });
    http.verify();
  });
});
