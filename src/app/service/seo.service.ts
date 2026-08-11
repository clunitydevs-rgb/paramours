import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Cliente } from '../models/models.interface';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly siteName = 'Paramours';
  private readonly siteUrl = 'https://paramours.cl';
  private readonly defaultTitle = 'Escorts en Santiago, Chile | Paramours';
  private readonly defaultDescription = 'Explora escorts en Santiago en Paramours: perfiles de acompañantes adultas independientes y opciones organizadas por comuna para facilitar tu búsqueda.';
  private readonly defaultImage = 'https://paramoursfilesblobazure.blob.core.windows.net/rpsfilescontainer/avatar_anunciante.png';

  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document
  ) { }

  clearRouteSeo(): void {
    this.title.setTitle(this.siteName);
    this.document.querySelectorAll('meta[name="description"], meta[name="robots"]').forEach(tag => tag.remove());
    this.document.querySelectorAll('meta[property^="og:"]').forEach(tag => tag.remove());
    this.document.querySelectorAll('meta[name^="twitter:"]').forEach(tag => tag.remove());
    this.document.querySelectorAll('link[rel="canonical"]').forEach(link => link.remove());
    this.document.querySelectorAll('script[type="application/ld+json"]').forEach(script => script.remove());
  }

  applyStaticRouteSeo(url: string): void {
    const path = this.normalizePath(url);
    const functionalTitles: Record<string, string> = {
      '/login': 'Iniciar sesión | Paramours',
      '/authkeys': 'Cambiar clave | Paramours',
      '/settingaccount': 'Editar perfil | Paramours',
      '/manage-profile': 'Administrar perfiles | Paramours',
      '/profile': 'Mi perfil | Paramours'
    };

    if (path === '/terminos-y-condiciones') {
      this.setLegalSeo(
        'Términos y condiciones | Paramours',
        'Consulta los términos y condiciones de uso de Paramours.cl.',
        `${this.siteUrl}/terminos-y-condiciones`
      );
      return;
    }

    if (path === '/politica-de-privacidad') {
      this.setLegalSeo(
        'Política de privacidad | Paramours',
        'Consulta la política de privacidad y tratamiento de datos de Paramours.cl.',
        `${this.siteUrl}/politica-de-privacidad`
      );
      return;
    }

    if (path === '/404') {
      this.setFunctionalSeo('Página no encontrada | Paramours');
      return;
    }

    if (path.startsWith('/account/')) {
      this.setFunctionalSeo('Crear cuenta | Paramours');
      return;
    }

    const functionalTitle = functionalTitles[path];
    if (functionalTitle) {
      this.setFunctionalSeo(functionalTitle);
    }
  }

  setHomeSeo(): void {
    this.clearRouteSeo();
    this.title.setTitle(this.defaultTitle);
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large' });
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

    this.setJsonLd('website-schema', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.siteName,
      url: this.siteUrl,
      description: this.defaultDescription,
      publisher: {
        '@type': 'Organization',
        name: this.siteName
      }
    });
  }

  setProfileSeo(profile: Cliente, profileUrl: string, imageUrl: string, locationName = ''): void {
    this.clearRouteSeo();
    const profileName = this.cleanText(profile.nombrE_USUARIO) || 'Perfil Paramours';
    const description = this.buildProfileDescription(profile, profileName);
    const location = this.cleanText(locationName);
    const title = location
      ? `${profileName} en ${location} - Escort VIP | Paramours`
      : `Escort ${profileName} | Paramours`;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-image-preview:large' });
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

  setInactiveProfileSeo(profileUrl: string): void {
    this.clearRouteSeo();
    const title = 'Perfil no activo | Paramours';
    const description = 'Este perfil de Paramours no se encuentra activo actualmente.';

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'robots', content: 'noindex, follow' });
    this.setDescription(description);
    this.setCanonical(profileUrl);

    this.setOpenGraph({
      title,
      description,
      image: this.defaultImage,
      url: profileUrl,
      type: 'website'
    });

    this.setTwitter({
      title,
      description,
      image: this.defaultImage
    });
  }

  private setFunctionalSeo(title: string): void {
    this.clearRouteSeo();
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'robots', content: 'noindex, follow' });
  }

  private setLegalSeo(title: string, description: string, canonicalUrl: string): void {
    this.clearRouteSeo();
    this.title.setTitle(title);
    this.setDescription(description);
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.setCanonical(canonicalUrl);
  }

  private normalizePath(url: string): string {
    const path = url.split('?')[0].split('#')[0] || '/';
    return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
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
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    this.document.head.appendChild(link);
  }

  private setJsonLd(id: string, schema: object): void {
    const script = this.document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    this.document.head.appendChild(script);
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
