import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { Cliente } from '../models/models.interface';
import { LocationSeoService } from './location-seo.service';
import { SeoService } from './seo.service';

describe('Global SEO route policy', () => {
  let seo: SeoService;
  let locationSeo: LocationSeoService;
  let meta: Meta;
  let title: Title;

  const profile = {
    iD_USUARIO: 42,
    nombrE_USUARIO: 'Perfil de prueba',
    descripcion: 'Descripción del perfil de prueba',
    edad: 25,
    altura: '165 cm',
    valor: 100000
  } as Cliente;

  const location = {
    locationName: 'Providencia',
    slug: 'providencia',
    description: 'Descripción de ubicación de prueba',
    profileCount: 2,
    faqs: [{ question: 'Pregunta', answer: 'Respuesta' }],
    locationType: 'commune' as const
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    seo = TestBed.inject(SeoService);
    locationSeo = TestBed.inject(LocationSeoService);
    meta = TestBed.inject(Meta);
    title = TestBed.inject(Title);
    seo.clearRouteSeo();
  });

  afterEach(() => seo.clearRouteSeo());

  function canonical(): string | null {
    return document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? null;
  }

  function schemas(): HTMLScriptElement[] {
    return Array.from(document.head.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'));
  }

  function expectNoSocialOrSchemas(): void {
    expect(document.head.querySelector('meta[property^="og:"]')).toBeNull();
    expect(document.head.querySelector('meta[name^="twitter:"]')).toBeNull();
    expect(schemas().length).toBe(0);
  }

  it('sets the Home as indexable with its canonical and real schema description', () => {
    seo.setHomeSeo();

    expect(meta.getTag("name='robots'")?.content).toBe('index, follow, max-image-preview:large');
    expect(canonical()).toBe('https://paramours.cl/');
    const schema = JSON.parse(document.getElementById('website-schema')?.textContent ?? '{}');
    expect(schemas().length).toBe(1);
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('WebSite');
    expect(schema.name).toBe('Paramours');
    expect(schema.url).toBe('https://paramours.cl/');
    expect(schema.description).toBe(meta.getTag("name='description'")?.content);
    expect(schema.potentialAction).toBeUndefined();
  });

  it('sets /login as noindex without inherited canonical, social tags or schemas', () => {
    seo.setHomeSeo();
    seo.clearRouteSeo();
    seo.applyStaticRouteSeo('/login');

    expect(title.getTitle()).toBe('Iniciar sesión | Paramours');
    expect(meta.getTag("name='robots'")?.content).toBe('noindex, follow');
    expect(canonical()).toBeNull();
    expectNoSocialOrSchemas();
  });

  it('sets /manage-profile as noindex', () => {
    seo.applyStaticRouteSeo('/manage-profile');
    expect(meta.getTag("name='robots'")?.content).toBe('noindex, follow');
  });

  it('sets both legal routes as indexable with their own canonical', () => {
    seo.applyStaticRouteSeo('/terminos-y-condiciones');
    expect(meta.getTag("name='robots'")?.content).toBe('index, follow');
    expect(canonical()).toBe('https://paramours.cl/terminos-y-condiciones');

    seo.applyStaticRouteSeo('/politica-de-privacidad');
    expect(meta.getTag("name='robots'")?.content).toBe('index, follow');
    expect(canonical()).toBe('https://paramours.cl/politica-de-privacidad');
  });

  it('sets /404 as noindex without inherited canonical or schemas', () => {
    seo.setHomeSeo();
    seo.clearRouteSeo();
    seo.applyStaticRouteSeo('/404');

    expect(meta.getTag("name='robots'")?.content).toBe('noindex, follow');
    expect(canonical()).toBeNull();
    expectNoSocialOrSchemas();
  });

  it('sets reusable on-page SEO for an active commune', () => {
    locationSeo.setLocationSeo({
      ...location,
      description: 'Explora escorts en Providencia en Paramours. Revisa perfiles de acompañantes adultas independientes, información publicada y medios de contacto.'
    });

    const description = meta.getTag("name='description'")?.content;
    const schema = JSON.parse(document.getElementById('location-schema')?.textContent ?? '{}');
    const collectionPage = schema['@graph']?.find((item: { '@type': string }) => item['@type'] === 'CollectionPage');
    const breadcrumb = schema['@graph']?.find((item: { '@type': string }) => item['@type'] === 'BreadcrumbList');
    const faqPage = schema['@graph']?.find((item: { '@type': string }) => item['@type'] === 'FAQPage');

    expect(schemas().length).toBe(1);
    expect(schema['@context']).toBe('https://schema.org');
    expect(title.getTitle()).toBe('Escorts en Providencia, Santiago | Paramours');
    expect(description).toBe('Explora escorts en Providencia en Paramours. Revisa perfiles de acompañantes adultas independientes, información publicada y medios de contacto.');
    expect(meta.getTag("name='robots'")?.content).toBe('index, follow, max-image-preview:large');
    expect(meta.getTag("property='og:title'")?.content).toBe(title.getTitle());
    expect(meta.getTag("property='og:description'")?.content).toBe(description);
    expect(meta.getTag("property='og:url'")?.content).toBe('https://paramours.cl/escort-providencia');
    expect(meta.getTag("name='twitter:title'")?.content).toBe(title.getTitle());
    expect(meta.getTag("name='twitter:description'")?.content).toBe(description);
    expect(canonical()).toBe('https://paramours.cl/escort-providencia');
    expect(collectionPage.name).toBe(title.getTitle());
    expect(collectionPage.description).toBe(description);
    expect(collectionPage.url).toBe('https://paramours.cl/escort-providencia');
    expect(breadcrumb.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Paramours', item: 'https://paramours.cl/' },
      { '@type': 'ListItem', position: 2, name: 'Escorts en Providencia', item: 'https://paramours.cl/escort-providencia' }
    ]);
    expect(faqPage.mainEntity).toEqual([{
      '@type': 'Question',
      name: 'Pregunta',
      acceptedAnswer: { '@type': 'Answer', text: 'Respuesta' }
    }]);
  });

  it('does not emit FAQPage when a directory has no visible FAQs', () => {
    locationSeo.setLocationSeo({ ...location, faqs: [] });
    const schema = JSON.parse(document.getElementById('location-schema')?.textContent ?? '{}');
    expect(schema['@graph'].some((item: { '@type': string }) => item['@type'] === 'FAQPage')).toBeFalse();
  });

  it('keeps a location without profiles as noindex', () => {
    locationSeo.setLocationSeo({ ...location, profileCount: 0 });
    expect(meta.getTag("name='robots'")?.content).toBe('noindex, follow');
  });

  it('sets coherent SEO and schemas for an active public profile', () => {
    const profileUrl = 'https://paramours.cl/profile/42/Perfil-de-prueba';
    const description = 'Conoce el perfil de Perfil de prueba, escort en Providencia, Santiago. Revisa la información publicada, disponibilidad y medios de contacto en Paramours.';
    seo.setProfileSeo(profile, profileUrl, 'profile.jpg', 'Providencia', '/escort-providencia');

    const schema = JSON.parse(document.getElementById('profile-schema')?.textContent ?? '{}');
    expect(title.getTitle()).toBe('Perfil de prueba - Escort en Providencia, Santiago | Paramours');
    expect(meta.getTag("name='description'")?.content).toBe(description);
    expect(meta.getTag("name='robots'")?.content).toBe('index, follow, max-image-preview:large');
    expect(meta.getTag("property='og:title'")?.content).toBe(title.getTitle());
    expect(meta.getTag("property='og:description'")?.content).toBe(description);
    expect(meta.getTag("property='og:url'")?.content).toBe(profileUrl);
    expect(meta.getTag("name='twitter:title'")?.content).toBe(title.getTitle());
    expect(meta.getTag("name='twitter:description'")?.content).toBe(description);
    expect(canonical()).toBe(profileUrl);
    expect(schema['@type']).toBe('ProfilePage');
    expect(schema.name).toBe(title.getTitle());
    expect(schema.description).toBe(description);
    expect(schema.url).toBe(profileUrl);
    expect(schema.mainEntity['@type']).toBe('Person');
    expect(schema.mainEntity.name).toBe('Perfil de prueba');
    expect(schema.mainEntity.description).toBe(description);
    expect(schema.mainEntity.jobTitle).toBeUndefined();
    expect(schema.mainEntity.address).toBeUndefined();
    expect(schema.mainEntity.aggregateRating).toBeUndefined();
    expect(schema.breadcrumb['@type']).toBe('BreadcrumbList');
    expect(schema.breadcrumb.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Paramours', item: 'https://paramours.cl/' },
      { '@type': 'ListItem', position: 2, name: 'Escorts en Providencia', item: 'https://paramours.cl/escort-providencia' },
      { '@type': 'ListItem', position: 3, name: 'Perfil de prueba', item: profileUrl }
    ]);
  });

  it('uses a two-level profile breadcrumb when no valid commune exists', () => {
    const profileUrl = 'https://paramours.cl/profile/42/Perfil-de-prueba';
    seo.setProfileSeo(profile, profileUrl, 'profile.jpg');
    const schema = JSON.parse(document.getElementById('profile-schema')?.textContent ?? '{}');
    expect(schema.breadcrumb.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Paramours', item: 'https://paramours.cl/' },
      { '@type': 'ListItem', position: 2, name: 'Perfil de prueba', item: profileUrl }
    ]);
  });

  it('keeps an inactive profile noindex without schemas', () => {
    seo.setInactiveProfileSeo('https://paramours.cl/profile/42/Perfil-de-prueba');
    expect(meta.getTag("name='robots'")?.content).toBe('noindex, follow');
    expect(schemas().length).toBe(0);
  });

  it('cleans Home and Profile metadata when navigating to Login', () => {
    seo.setHomeSeo();
    seo.setProfileSeo(profile, 'https://paramours.cl/profile/42/perfil-prueba', 'profile.jpg', 'Providencia');
    seo.clearRouteSeo();
    seo.applyStaticRouteSeo('/login');

    expect(canonical()).toBeNull();
    expectNoSocialOrSchemas();
  });

  it('replaces Location metadata with Home metadata', () => {
    seo.setHomeSeo();
    locationSeo.setLocationSeo(location);
    seo.setHomeSeo();

    expect(document.getElementById('location-schema')).toBeNull();
    expect(document.getElementById('website-schema')).not.toBeNull();
    expect(canonical()).toBe('https://paramours.cl/');
  });

  it('replaces Profile metadata with Location metadata', () => {
    seo.setProfileSeo(profile, 'https://paramours.cl/profile/42/perfil-prueba', 'profile.jpg', 'Providencia');
    locationSeo.setLocationSeo(location);

    expect(document.getElementById('profile-schema')).toBeNull();
    expect(document.getElementById('location-schema')).not.toBeNull();
    expect(canonical()).toBe('https://paramours.cl/escort-providencia');
  });

  it('cleans Location metadata when navigating to Login', () => {
    locationSeo.setLocationSeo(location);
    seo.clearRouteSeo();
    seo.applyStaticRouteSeo('/login');

    expect(canonical()).toBeNull();
    expectNoSocialOrSchemas();
  });
});
