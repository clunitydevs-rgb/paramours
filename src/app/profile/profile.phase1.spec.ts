import { CommonModule } from '@angular/common';
import { EventEmitter, makeStateKey, REQUEST_CONTEXT, TransferState } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { Observable, of, Subscriber } from 'rxjs';
import { App } from '../app';
import { ApiServices } from '../api/api.service';
import { MethodService } from '../method/method.service';
import { AnalyticsService } from '../service/analytics.service';
import { WebVisitService } from '../service/web-visit.service';
import { ToastService } from '../service/toast.service';
import { Home } from '../home/home';
import { BlogList } from '../blog/blog-list';
import { BlogService } from '../service/blog.service';
import { Pagenotfound } from '../pagenotfound/pagenotfound';
import { Profile } from './profile';

describe('Phase 1 profile route identity and cancellation', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<App>>;
  let router: Router;
  let requests: { id: number; subscriber: Subscriber<any>; cancelled: boolean }[];
  let media: { id: number; subscriber: Subscriber<any>; cancelled: boolean }[];
  const names: Record<number, string> = { 6: 'Fran', 78: 'Favi', 58: 'Agatha', 25: 'Gemma', 88: 'Sofi' };
  const response = (id: number) => ({ ncoderror: '0', oClient: {
    iD_USUARIO: id, nombrE_USUARIO: names[id], slug: `Escort-${names[id]}`,
    genero: [25, 88].includes(id) ? 0 : 1, estado: 'V', tipo: '2', ciudad: 0,
    comuna: 1, metro: 0, descripcion: `Description ${names[id]}`, fotO_PERFIL: `${id}.jpg`
  } });
  beforeEach(async () => {
    requests = []; media = [];
    const api = {
      getClientById: ({ sUid }: any) => new Observable(subscriber => {
        const r = { id: sUid, subscriber, cancelled: false }; requests.push(r);
        return () => { r.cancelled = true; };
      }),
      getMediaFiles: ({ sUid }: any) => new Observable(subscriber => {
        const r = { id: sUid, subscriber, cancelled: false }; media.push(r);
        return () => { r.cancelled = true; };
      }),
      getClients: () => of({ ncoderror: '0', oClient: [] }),
      getCiudades: () => of([{ id: 0, nombre: 'Santiago', slug: 'santiago' }]),
      getComunas: () => of([{ id: 1, nombre: 'Providencia', slug: 'providencia' }]),
      getMetros: () => of([]), getNaciones: () => of([]),
      getGeneros: () => of([{ id: 0, nombre: 'Masajista' }, { id: 1, nombre: 'Escort' }]),
      getColorOjos: () => of([]), getColorCabello: () => of([]), getBiotipo: () => of([]),
      GetCountReviewByUser: () => of(0), GetValReviewById: () => of({ oValReview: { valoracion: '0' } }),
      GetAllActiveStoriesUser: () => of({ oStories: [] })
    };
    await TestBed.configureTestingModule({ imports: [App], providers: [
      provideRouter([{ path: '', component: Home }, { path: 'blog', component: BlogList },
        { path: 'profile/:sUid/:sLug', component: Profile }]),
      { provide: ApiServices, useValue: api }, { provide: REQUEST_CONTEXT, useValue: null },
      { provide: BlogService, useValue: { getBlogs: () => of({ ncoderror: 0, oBlog: [] }) } },
      { provide: MethodService, useValue: { getItemLocalStorage: () => '',
        tInProcess: new EventEmitter(), tMediaFiles: new EventEmitter(), tStoriesHome: new EventEmitter(),
        setItemLocalStorage: () => {}, delUserLocalStorage: () => {} } },
      { provide: AnalyticsService, useValue: { trackEvent: () => {}, trackPage: () => {} } },
      { provide: WebVisitService, useValue: { registerEvent: () => {} } },
      { provide: ToastService, useValue: { error: () => {} } }
    ] }).overrideComponent(App, { set: { imports: [RouterOutlet], template: '<router-outlet />' } })
      .overrideComponent(Profile, { set: { imports: [CommonModule, Pagenotfound], template: `
        @if (profileViewState === 'ready') { <h1>{{profileHeading}}</h1><p>{{oCliente.descripcion}}</p> }
        @if (profileViewState === 'not-found') { <app-pagenotfound /> }` } })
      .overrideComponent(Home, { set: { imports: [], template: '<h1>Home</h1>' } })
      .overrideComponent(BlogList, { set: { imports: [], template: '<h1>Blog</h1>' } }).compileComponents();
    fixture = TestBed.createComponent(App); router = TestBed.inject(Router); fixture.detectChanges();
  });
  const path = (id: number) => `/profile/${id}/Escort-${names[id] || 'Missing'}`;
  async function navigate(id: number) { await router.navigateByUrl(path(id)); fixture.detectChanges(); }
  function resolve(id: number) {
    const request = requests.filter(r => r.id === id).at(-1)!;
    request.subscriber.next(response(id)); request.subscriber.complete(); fixture.detectChanges();
  }
  function assertProfile(id: number) {
    expect(router.url).toBe(path(id));
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(names[id]);
    expect(TestBed.inject(Title).getTitle()).toContain(names[id]);
    expect(TestBed.inject(Meta).getTag('name="description"')?.content).toContain(names[id]);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`https://paramours.cl${path(id)}`);
    expect(TestBed.inject(Meta).getTag('property="og:url"')?.content).toBe(`https://paramours.cl${path(id)}`);
    expect(document.getElementById('profile-schema')?.textContent).toContain(names[id]);
  }
  for (const order of [[58, 78, 6], [6, 78, 58]]) {
    for (const lateFirst of [false, true]) it(`cancels obsolete profiles for ${order.join(' -> ')} (old response first: ${lateFirst})`, async () => {
      await navigate(order[0]); resolve(order[0]);
      await navigate(order[1]); const late = requests.at(-1)!;
      await navigate(order[2]); expect(late.cancelled).toBeTrue();
      expect(document.querySelector('link[rel="canonical"]')).toBeNull();
      if (lateFirst) late.subscriber.next(response(order[1]));
      resolve(order[2]);
      if (!lateFirst) late.subscriber.next(response(order[1]));
      fixture.detectChanges(); assertProfile(order[2]);
    });
  }
  for (const destination of ['/', '/blog']) it(`cannot change SEO after leaving for ${destination}`, async () => {
    await navigate(78); const late = requests.at(-1)!;
    await router.navigateByUrl(destination); fixture.detectChanges(); const title = TestBed.inject(Title).getTitle();
    late.subscriber.next(response(78)); fixture.detectChanges();
    expect(late.cancelled).toBeTrue(); expect(TestBed.inject(Title).getTitle()).toBe(title);
    expect(document.getElementById('profile-schema')).toBeNull();
  });
  it('keeps a missing destination despite an earlier successful response', async () => {
    await navigate(78); const late = requests.at(-1)!;
    await navigate(999999); requests.at(-1)!.subscriber.error({ status: 404 }); fixture.detectChanges();
    late.subscriber.next(response(78)); fixture.detectChanges();
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex, follow');
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });
  for (const order of [[25, 6], [6, 25], [88, 58]]) it(`recomputes category ${order.join(' -> ')}`, async () => {
    for (const id of order) { await navigate(id); resolve(id); fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain([25, 88].includes(id) ? 'Masajista' : 'Escort');
      assertProfile(id);
    }
  });
  it('cancels gallery requests and clears images when identity changes', async () => {
    await navigate(58); resolve(58); await fixture.whenStable(); fixture.detectChanges();
    const old = media.at(-1)!; expect(old.id).toBe(58); const emitted: any[] = [];
    TestBed.inject(MethodService).tMediaFiles.subscribe(value => emitted.push(value));
    await navigate(6); expect(old.cancelled).toBeTrue(); old.subscriber.next({ oMediaFiles: [{ iUid: 58 }] });
    expect(emitted.at(-1)).toEqual([]);
  });
  for (const status of [0, 500, 503]) it(`does not mark temporary failure ${status} as noindex or 404`, async () => {
    await navigate(6); requests.at(-1)!.subscriber.error({ status }); fixture.detectChanges();
    expect(TestBed.inject(Meta).getTag('name="robots"')).toBeNull();
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    await navigate(58); resolve(58); assertProfile(58);
  });

  it('preserves SEO for a reused identity when only query parameters or the slug change', async () => {
    await navigate(6); resolve(6);
    for (const url of [path(6) + '?utm_source=test', '/profile/6/old-slug']) {
      await router.navigateByUrl(url); fixture.detectChanges();
      expect(TestBed.inject(Title).getTitle()).toContain('Fran');
      expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://paramours.cl' + path(6));
    }
    expect(requests.length).toBe(1);
  });

  for (const role of ['administrator', 'owner']) it(`refreshes reduced inactive SSR data for its authorized ${role} view`, async () => {
    TestBed.inject(MethodService).getItemLocalStorage = (key: string) =>
      key === 'cl.paramours.typeuser' ? (role === 'administrator' ? '0' : '2') :
        key === 'cl.paramours.sUid' ? (role === 'administrator' ? '999' : '58') : '';
    TestBed.inject(TransferState).set(makeStateKey<unknown>('public-page:profile:58'), {
      kind: 'found', profile: { iD_USUARIO: 58, nombrE_USUARIO: 'Agatha', slug: 'Escort-Agatha', estado: 'N' }
    });
    await navigate(58);
    expect(requests.length).toBe(1);
    const data = response(58); data.oClient.estado = 'N';
    requests[0].subscriber.next(data); requests[0].subscriber.complete(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('p')?.textContent).toBe('Description Agatha');
    assertProfile(58);
  });

  it('keeps reduced inactive SSR data unavailable to anonymous visitors without a redundant lookup', async () => {
    TestBed.inject(TransferState).set(makeStateKey<unknown>('public-page:profile:58'), {
      kind: 'found', profile: { iD_USUARIO: 58, nombrE_USUARIO: 'Agatha', slug: 'Escort-Agatha', estado: 'N' }
    });
    await navigate(58);
    expect(requests.length).toBe(0);
    expect(TestBed.inject(Title).getTitle()).toBe('Perfil no activo | Paramours');
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex, follow');
    expect(fixture.nativeElement.querySelector('p')).toBeNull();
  });

  it('releases the deferred home stories timer or load listener when destroyed', fakeAsync(() => {
    const api = TestBed.inject(ApiServices);
    const stories = spyOn(api, 'GetAllActiveStoriesUser').and.callThrough();
    const home = TestBed.createComponent(Home);
    home.detectChanges();
    home.destroy();
    window.dispatchEvent(new Event('load'));
    tick(300);
    expect(stories).not.toHaveBeenCalled();
  }));
});
