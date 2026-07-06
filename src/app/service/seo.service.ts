import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Cliente } from '../models/models.interface';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly siteName = 'Paramours';
  private readonly siteUrl = 'https://paramours.cl';
  private readonly defaultTitle = 'Paramours | Escorts en Chile';
  private readonly defaultDescription = 'Paramours, Portal de chicas y mujeres escort, escorts VIP en Chile, Santiago, Providencia y Las Condes. Chilenas escorts amateur reales. Private club premium para experiencias exclusivas y perfiles selectos';
  private readonly defaultImage = 'https://paramoursfilesblobazure.blob.core.windows.net/rpsfilescontainer/avatar_anunciante.png';

  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document
  ) { }

  setHomeSeo(): void {
    this.title.setTitle(this.defaultTitle);
    this.setDescription(this.defaultDescription);
    this.setCanonical(this.siteUrl);

    this.setOpenGraph({
      title: this.defaultTitle,
      description: this.defaultDescription,
      image: this.defaultImage,
      url: this.siteUrl,
      type: 'website'
    });

    this.setTwitter({
      title: this.defaultTitle,
      description: this.defaultDescription,
      image: this.defaultImage
    });

    this.removeJsonLd('profile-schema');
    this.setJsonLd('website-schema', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.siteName,
      url: this.siteUrl,
      description: this.defaultTitle,
      publisher: {
        '@type': 'Organization',
        name: this.siteName
      }
    });
  }

  setProfileSeo(profile: Cliente, profileUrl: string, imageUrl: string): void {
    const profileName = this.cleanText(profile.nombrE_USUARIO) || 'Perfil Paramours';
    const description = this.buildProfileDescription(profile, profileName);
    const title = `Escort ${profileName} | Paramours`;

    this.title.setTitle(title);
    this.setDescription(description);
    this.setCanonical(profileUrl);

    this.setOpenGraph({
      title,
      description,
      image: imageUrl || this.defaultImage,
      url: profileUrl,
      type: 'profile'
    });

    this.setTwitter({
      title,
      description,
      image: imageUrl || this.defaultImage
    });

    this.setJsonLd('profile-schema', {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: title,
      url: profileUrl,
      primaryImageOfPage: imageUrl || this.defaultImage,
      mainEntity: {
        '@type': 'Person',
        name: profileName,
        image: imageUrl || this.defaultImage,
        description
      }
    });
  }

  private buildProfileDescription(profile: Cliente, profileName: string): string {
    const description = this.cleanText(profile.descripcion);

    if (description) {
      return this.truncate(description, 160);
    }

    const details = [
      profile.edad ? `${profile.edad} anos` : '',
      this.cleanText(profile.altura),
      profile.valor ? `desde ${profile.valor}` : ''
    ].filter(Boolean);

    return this.truncate(`Conoce el perfil de ${profileName} en Paramours.cl${details.length ? ': ' + details.join(', ') : '.'}`, 160);
  }

  private setDescription(description: string): void {
    this.meta.updateTag({ name: 'description', content: description });
  }

  private setOpenGraph(data: { title: string; description: string; image: string; url: string; type: string }): void {
    this.meta.updateTag({ property: 'og:site_name', content: this.siteName });
    this.meta.updateTag({ property: 'og:locale', content: 'es_CL' });
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:image', content: data.image });
    this.meta.updateTag({ property: 'og:url', content: data.url });
    this.meta.updateTag({ property: 'og:type', content: data.type });
  }

  private setTwitter(data: { title: string; description: string; image: string }): void {
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });
    this.meta.updateTag({ name: 'twitter:image', content: data.image });
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  private setJsonLd(id: string, schema: object): void {
    this.removeJsonLd(id);

    const script = this.document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }

  private removeJsonLd(id: string): void {
    this.document.getElementById(id)?.remove();
  }

  private cleanText(value: string | null | undefined): string {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  private truncate(value: string, maxLength: number): string {
    const text = this.cleanText(value);

    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength - 1).trim()}...`;
  }
}
