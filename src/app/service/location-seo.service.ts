import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from './seo.service';

export interface LocationSeoData {
  locationName: string;
  slug: string;
  description: string;
  profileCount: number;
  faqs: Array<{ question: string; answer: string }>;
  locationType?: 'city' | 'commune' | 'metro';
}

@Injectable({ providedIn: 'root' })
export class LocationSeoService {
  private readonly siteUrl = 'https://paramours.cl';
  private readonly socialFallbackImage = 'https://paramours.cl/assets/images/logo-footer.png';

  constructor(
    private title: Title,
    private meta: Meta,
    private seoService: SeoService,
    @Inject(DOCUMENT) private document: Document
  ) { }

  setLocationSeo(data: LocationSeoData): void {
    this.seoService.clearRouteSeo();
    const title = data.locationType === 'commune'
      ? `Escorts en ${data.locationName}, Santiago | Paramours`
      : data.slug === 'santiago'
        ? 'Escorts en Santiago | Acompañantes VIP y masajes | Paramours'
        : `Escorts en ${data.locationName} | Perfiles verificados | Paramours`;
    const url = `${this.siteUrl}/escort-${data.slug}`;
    const canIndex = data.profileCount > 0;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: data.description });
    this.meta.updateTag({ name: 'robots', content: canIndex ? 'index, follow, max-image-preview:large' : 'noindex, follow' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Paramours' });
    this.meta.updateTag({ property: 'og:locale', content: 'es_CL' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:image', content: this.socialFallbackImage });
    this.meta.updateTag({ property: 'og:image:alt', content: `Escorts en ${data.locationName} - Paramours` });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });
    this.meta.updateTag({ name: 'twitter:image', content: this.socialFallbackImage });
    this.meta.updateTag({ name: 'twitter:image:alt', content: `Escorts en ${data.locationName} - Paramours` });
    this.setCanonical(url);
    this.setJsonLd(data, title, url);
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }

  private setJsonLd(data: LocationSeoData, title: string, url: string): void {
    this.document.getElementById('location-schema')?.remove();
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': `${url}#collection`,
          name: title,
          description: data.description,
          url,
          about: { '@type': 'Place', name: data.locationName },
          numberOfItems: data.profileCount,
          isPartOf: { '@type': 'WebSite', name: 'Paramours', url: this.siteUrl }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Paramours', item: `${this.siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: `Escorts en ${data.locationName}`, item: url }
          ]
        },
        ...(data.faqs.length > 0
          ? [{
            '@type': 'FAQPage',
            mainEntity: data.faqs.map(faq => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer }
            }))
          }]
          : [])
      ]
    };
    const script = this.document.createElement('script');
    script.id = 'location-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }
}