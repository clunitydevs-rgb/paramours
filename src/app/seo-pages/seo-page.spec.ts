import { By } from '@angular/platform-browser';
import { Storieshome } from '../storieshome/storieshome';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Meta, Title } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { routes } from '../app.routes';
import { ApiServices } from '../api/api.service';
import { ToastService } from '../service/toast.service';
import { MethodService } from '../method/method.service';
import { SEO_PAGES, matchesSeoPageLocation } from './seo-pages.config';
import { buildSitemapXml } from '../../sitemap';

const cities = [{ id: 0, slug: 'santiago', nombre: 'Santiago' }, { id: 3, slug: 'calama', nombre: 'Calama' }];
const communes = [{ id: '1', slug: 'providencia', nombre: 'Providencia', id_ciudad: '0' }, { id: '0', slug: 'las-condes', nombre: 'Las Condes', id_ciudad: '0' }];
const profiles = [
  { iD_USUARIO: 10, nombrE_USUARIO: 'Ana', slug: 'ana', ciudad: 0, comuna: 1, estado: 'V' },
  { iD_USUARIO: 11, nombrE_USUARIO: 'Bea', slug: 'bea', ciudad: 0, comuna: 0, estado: 'V' },
  { iD_USUARIO: 12, nombrE_USUARIO: 'Cata', slug: 'cata', ciudad: 3, comuna: 1, estado: 'V' },
  { iD_USUARIO: 13, nombrE_USUARIO: 'Inactiva', slug: 'inactiva', ciudad: 0, comuna: 1, estado: 'N' }
];

describe('SEO pages', () => {
  let stories: Subject<any>;
  let api: any;
  beforeEach(() => {
    stories = new Subject();
    api = {
      getClients: jasmine.createSpy().and.returnValue(of({ oClient: profiles })),
      getCiudades: () => of(cities), getComunas: () => of(communes), getMetros: () => of([]),
      GetAllActiveStoriesUser: jasmine.createSpy().and.returnValue(stories)
    };
    TestBed.configureTestingModule({ providers: [provideRouter(routes),
      { provide: ApiServices, useValue: api },
      { provide: ToastService, useValue: { error: jasmine.createSpy() } }
    ] });
  });

  for (const page of SEO_PAGES) {
    it(`renders ${page.path} with metadata, filtered catalog, stories and profile links`, async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(page.path === 'locanto-cl' ? '/locanto-cl/' : `/${page.path}`);
      harness.detectChanges();
      const root = harness.routeNativeElement!;
      const expected = profiles.filter(p => p.estado === 'V' && matchesSeoPageLocation(page, p, cities, communes));
      expect(root.querySelector('h1')?.textContent).toBe(page.h1);
      expect(root.querySelectorAll('a.profile-card').length).toBe(expected.length);
      for (const profile of expected) expect(root.querySelector(`a[href="/profile/${profile.iD_USUARIO}/${profile.slug}"]`)).not.toBeNull();
      expect(TestBed.inject(Title).getTitle()).toBe(page.title);
      expect(TestBed.inject(Meta).getTag('name="description"')?.content).toBe(page.description);
      expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`https://paramours.cl${page.canonicalPath}`);
      expect(TestBed.inject(Meta).getTag('property="og:url"')?.content).toBe(`https://paramours.cl${page.canonicalPath}`);
      expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toContain(page.indexable ? 'index, follow' : 'noindex, follow');
      stories.next({ oStories: profiles.map(p => ({ iD_USUARIO: p.iD_USUARIO, nomUsuario: p.nombrE_USUARIO,
        fotoPerfilUsuario: 'avatar.png', noM_MEDIA: 'story.jpg', mediA_TYPE: 'image/jpeg', fecha: new Date().toISOString() })) });
      harness.detectChanges();
      expect(root.querySelector('app-storieshome')).not.toBeNull();
      const viewer = harness.routeDebugElement!.query(By.directive(Storieshome)).componentInstance as Storieshome;
      expect(viewer.storiesAgrupadas.length).toBe(expected.length);
      viewer.onPreviewImg(0);
      expect(viewer.isViewerOpen).toBeTrue();
      expect(viewer.currentUserName).toBe(expected[0].nombrE_USUARIO);
      viewer.close();
      expect(viewer.isViewerOpen).toBeFalse();
      const emissions: any[] = [];
      const subscription = TestBed.inject(MethodService).tStoriesHome.subscribe(value => emissions.push(value));
      stories.next({ oStories: profiles.map(p => ({ iD_USUARIO: p.iD_USUARIO })) });
      expect(emissions.at(-1).map((s: any) => s.iD_USUARIO)).toEqual(expected.map(p => p.iD_USUARIO));
      subscription.unsubscribe();
    });
  }

  it('updates reused routes without retaining catalog, metadata or late story requests', async () => {
    const harness = await RouterTestingHarness.create('/sexo-providencia');
    const oldStories = stories;
    stories = new Subject();
    api.GetAllActiveStoriesUser.and.returnValue(stories);
    await harness.navigateByUrl('/sexo-las-condes');
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toContain('Las Condes');
    expect(harness.routeNativeElement!.querySelector('a.profile-card')?.getAttribute('href')).toBe('/profile/11/bea');
    expect(oldStories.observed).toBeFalse();
    expect(document.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(TestBed.inject(Router).url).toBe('/sexo-las-condes');
  });

  it('keeps valid empty pages available and noindex', async () => {
    api.getClients.and.returnValue(of({ oClient: [] }));
    const harness = await RouterTestingHarness.create('/sexo-providencia');
    expect(harness.routeNativeElement!.textContent).toContain('No hay perfiles disponibles');
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex, follow');
    expect(api.GetAllActiveStoriesUser).not.toHaveBeenCalled();
  });

  it('renders an unavailable catalog without indexing an empty result', async () => {
    api.getClients.and.returnValue(throwError(() => new Error('Unavailable')));
    const harness = await RouterTestingHarness.create('/escorts-chile');
    expect(harness.routeNativeElement!.textContent).toContain('temporalmente');
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex, follow');
    expect(api.GetAllActiveStoriesUser).not.toHaveBeenCalled();
  });

  it('preserves home and commune navigation after a SEO page', async () => {
    const harness = await RouterTestingHarness.create('/sexo-providencia');
    await harness.navigateByUrl('/');
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('Escorts independientes en Chile');
    expect(TestBed.inject(Title).getTitle()).toBe('Escort Chile | Escorts independientes | Paramours');
    expect(harness.routeNativeElement!.querySelectorAll('a.profile-card').length).toBe(profiles.length);
    await harness.navigateByUrl('/escort-providencia');
    expect(harness.routeNativeElement!.textContent).toContain('Providencia');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://paramours.cl/escort-providencia');
  });

  it('excludes aliases and empty geographic pages from sitemap', () => {
    const xml = buildSitemapXml(profiles.filter(p => p.iD_USUARIO === 10), communes, cities);
    expect(xml).toContain('<loc>https://paramours.cl/sexo-providencia</loc>');
    expect(xml).not.toContain('<loc>https://paramours.cl/sexo-las-condes</loc>');
    expect(xml).not.toContain('<loc>https://paramours.cl/escort</loc>');
    expect(xml).not.toContain('<loc>https://paramours.cl/escorts</loc>');
    expect(xml).toContain('<loc>https://paramours.cl/locanto-cl/</loc>');
  });
});
