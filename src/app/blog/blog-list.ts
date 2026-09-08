import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BlogPost, isPublishedBlog } from '../models/blog.interface';
import { BlogService } from '../service/blog.service';
import { SeoService } from '../service/seo.service';
import { SsrResponseService } from '../service/ssr-response.service';

@Component({
  selector: 'app-blog-list', imports: [CommonModule, RouterLink],
  templateUrl: './blog-list.html', styleUrl: './blog.css'
})
export class BlogList implements OnInit {
  posts: BlogPost[] = [];
  loading = true;
  loadError = false;
  private readonly api = inject(BlogService);
  private readonly seo = inject(SeoService);
  private readonly response = inject(SsrResponseService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.seo.setBlogSeo();
    this.api.getBlogs().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        if (String(result.ncoderror) !== '0' || !Array.isArray(result.oBlog)) { this.fail(); return; }
        this.posts = result.oBlog.filter(isPublishedBlog)
          .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
        this.loading = false;
      },
      error: () => this.fail()
    });
  }

  private fail(): void {
    this.loading = false;
    this.loadError = true;
    this.response.setUnavailable();
    this.seo.setBlogUnavailableSeo();
  }
}
