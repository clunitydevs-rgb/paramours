import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { defer, Observable, of, tap, timeout } from 'rxjs';
import { BLOG_API_URL, GetBlogBySlugResponse, GetBlogsResponse } from '../models/blog.interface';

export const BLOG_API_BASE = new InjectionToken<string>('BLOG_API_BASE', { providedIn: 'root', factory: () => BLOG_API_URL });

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(BLOG_API_BASE);
  private readonly state = inject(TransferState);
  private readonly server = isPlatformServer(inject(PLATFORM_ID));

  getBlogs(): Observable<GetBlogsResponse> {
    return this.transferred('list', () => this.http.get<GetBlogsResponse>(`${this.base}/GetBlogs`, { transferCache: false }));
  }

  getBlogBySlug(slug: string): Observable<GetBlogBySlugResponse> {
    return this.transferred(`post:${slug}`, () => this.http.post<GetBlogBySlugResponse>(
      `${this.base}/GetBlogBySlug`, { sSlug: slug }, { transferCache: false }));
  }

  private transferred<T>(name: string, request: () => Observable<T>): Observable<T> {
    return defer(() => {
      const key = makeStateKey<T | null>(`blog:${name}`);
      if (!this.server && this.state.hasKey(key)) {
        const value = this.state.get(key, null)!;
        this.state.remove(key);
        return of(value);
      }
      return request().pipe(timeout(6000), tap(value => {
        if (this.server) this.state.set(key, value);
      }));
    });
  }
}
