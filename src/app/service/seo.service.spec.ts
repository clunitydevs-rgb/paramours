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
    expect(schema.description).toBe(meta.getTag("name='description'")?.content);
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
  });

  it('keeps a location without profiles as noindex', () => {
    locationSeo.setLocationSeo({ ...location, profileCount: 0 });
    expect(meta.getTag("name='robots'")?.content).toBe('noindex, follow');
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
