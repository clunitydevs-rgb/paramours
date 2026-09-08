import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';
import { BlogPost, isPublishedBlog } from '../models/blog.interface';
import { Pagenotfound } from '../pagenotfound/pagenotfound';
import { BlogService } from '../service/blog.service';
import { SeoService } from '../service/seo.service';
import { SsrResponseService } from '../service/ssr-response.service';

@Component({
  selector: 'app-blog-article', imports: [CommonModule, RouterLink, Pagenotfound],
  templateUrl: './blog-article.html', styleUrl: './blog.css',
  // The stylesheet is scoped with .blog-* selectors, including sanitized innerHTML.
  encapsulation: ViewEncapsulation.None
})
export class BlogArticle implements OnInit {
  post: BlogPost | null = null;
  loading = true;
  notFound = false;
  loadError = false;
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(BlogService);
  private readonly seo = inject(SeoService);
  private readonly response = inject(SsrResponseService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      tap(() => { this.post = null; this.loading = true; this.notFound = false; this.loadError = false; }),
      switchMap(params => this.api.getBlogBySlug(params.get('slug') || '').pipe(
        catchError(error => {
          if (error.status === 404) return of({ oBlog: null, ncoderror: 0, message: '' });
          this.loadError = true;
          this.response.setUnavailable();
          this.seo.setBlogUnavailableSeo();
          return of(null);
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      this.loading = false;
      if (!result) return;
      if (String(result.ncoderror) !== '0' || !isPublishedBlog(result.oBlog)) {
        this.notFound = true;
        this.response.setNotFound();
        this.seo.applyStaticRouteSeo('/404');
        return;
      }
      this.post = result.oBlog;
      this.seo.setBlogSeo(this.post);
    });
  }
}
