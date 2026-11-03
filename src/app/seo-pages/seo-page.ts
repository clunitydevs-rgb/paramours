import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { Home } from '../home/home';
import { SeoPageConfig } from './seo-pages.config';

@Component({
  selector: 'app-seo-page',
  imports: [Home, AsyncPipe],
  template: `@for (page of (pages$ | async); track page.path) { <app-home [seoPage]="page" /> }`
})
export class SeoPage {
  readonly pages$ = inject(ActivatedRoute).data.pipe(map(data => [data['seoPage'] as SeoPageConfig]));
}
