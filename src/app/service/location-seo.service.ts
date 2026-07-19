import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class LocationSeoService {
  private readonly siteUrl = 'https://paramours.cl';
  private readonly defaultImage = 'https://paramoursfilesblobazure.blob.core.windows.net/rpsfilescontainer/avatar_anunciante.png';

  constructor(private title: Title, private meta: Meta, @Inject(DOCUMENT) private document: Document) { }

  setLocationSeo(locationName: string, slug: string): void {
    const title = `Escorts en ${locationName} | Paramours`;
    const description = `Encuentra escorts en ${locationName}. Perfiles verificados, fotografías reales y contacto directo en Paramours.`;
    const url = `${this.siteUrl}/escorts-${slug}`;
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:site_name', content: 'Paramours' });
    this.meta.updateTag({ property: 'og:locale', content: 'es_CL' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: this.defaultImage });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: this.defaultImage });
    this.setCanonical(url);
    this.setJsonLd({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description, url, about: { '@type': 'Place', name: locationName } });
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

  private setJsonLd(schema: object): void {
    this.document.getElementById('location-schema')?.remove();
    const script = this.document.createElement('script');
    script.id = 'location-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }
}
