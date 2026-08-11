import { Component, OnInit } from '@angular/core';
import { SeoService } from '../service/seo.service';
import { SsrResponseService } from '../service/ssr-response.service';

@Component({
  selector: 'app-pagenotfound',
  imports: [],
  templateUrl: './pagenotfound.html',
  styleUrl: './pagenotfound.css'
})
export class Pagenotfound implements OnInit {
  constructor(
    private seoService: SeoService,
    private ssrResponse: SsrResponseService
  ) { }

  ngOnInit(): void {
    this.ssrResponse.setNotFound();
    this.seoService.applyStaticRouteSeo('/404');
  }
}