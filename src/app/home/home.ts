import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SeoPageConfig, matchesSeoPageLocation } from '../seo-pages/seo-pages.config';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, Input, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiServices } from '../api/api.service';
import { ToastService } from '../service/toast.service';
import { rStoriesHome } from '../models/response.interface';
import { Storieshome } from "../storieshome/storieshome";
import { MethodService } from '../method/method.service';
import { Cliente } from '../models/models.interface';
import { catchError, forkJoin, map, of, timeout } from 'rxjs';
import { SeoService } from '../service/seo.service';
import { getActiveProfileLocationIds, isPublicActiveProfile } from '../../sitemap';
import type { SitemapProfile } from '../../sitemap';
import { PublicPageDataService } from '../service/public-page-data.service';
import { SsrResponseService } from '../service/ssr-response.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, Storieshome],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  @Input() seoPage?: SeoPageConfig;
  private readonly destroyRef = inject(DestroyRef);
  private readonly publicData = inject(PublicPageDataService);
  private readonly ssrResponse = inject(SsrResponseService);
  private clientsLoaded = false;
  private locationsLoaded = false;
  private pageStoriesLoaded = false;
  catalogError = false;

  //sUrlRps: string = "https://demofilesblobazure.blob.core.windows.net/rpsfilescontainer/";
  sUrlRps: string = "https://paramoursfilesblobazure.blob.core.windows.net/rpsfilescontainer/";
  proFileImg: string = this.sUrlRps + "avatar_anunciante.png";
  arrItems: Cliente[] = [];
  nTotalClienteCount: number = 0;
  oData: Cliente[] = [];
  oCiudades: Array<any> = [];
  oComunas: Array<any> = [];
  oMetros: Array<any> = [];
  locationLinks: Array<{ label: string; url: string }> = [];

  constructor(
    private api: ApiServices,
    private methodservice: MethodService,
    private toastService: ToastService,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: object
  ) { }

  ngOnInit(): void {
    const isBrowser = isPlatformBrowser(this.platformId);
    forkJoin({
      clients: this.publicData.catalog(),
      ciudades: this.api.getCiudades().pipe(timeout(6000)),
      comunas: this.api.getComunas().pipe(timeout(6000)),
      metros: this.api.getMetros().pipe(timeout(6000))
    }).pipe(map(data => {
      if (![data.ciudades, data.comunas, data.metros].every(Array.isArray)) throw new Error('Invalid location catalog');
      return data;
    }), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ clients, ciudades, comunas, metros }) => {
        if (clients === null) { this.markUnavailable(); return; }
        this.clientsLoaded = this.locationsLoaded = true;
        this.oCiudades = ciudades; this.oComunas = comunas; this.oMetros = metros;
        this.oData = clients;
        this.arrItems = [...clients];
        this.nTotalClienteCount = clients.length;
        if (this.seoPage) this.updatePageCatalog();
        else this.seoService.setHomeSeo();
        this.updateLocationLinks();
        if (isBrowser && this.arrItems.length > 0) {
          this.methodservice.setItemLocalStorage('cl.paramours.arrItems', JSON.stringify(this.arrItems));
        }
      },
      error: () => this.markUnavailable()
    });
    if (isBrowser && !this.seoPage) this.scheduleStoriesLoad();
  }

  private markUnavailable(): void {
    this.catalogError = true;
    this.ssrResponse.setUnavailable();
    this.seoService.setUnavailableSeo();
  }

  private updatePageCatalog(): void {
    if (!this.seoPage || !this.clientsLoaded || !this.locationsLoaded) return;
    this.arrItems = this.catalogError ? [] : this.oData.filter(profile =>
      isPublicActiveProfile(profile as unknown as SitemapProfile)
      && matchesSeoPageLocation(this.seoPage!, profile, this.oCiudades, this.oComunas));
    this.nTotalClienteCount = this.arrItems.length;
    this.seoService.setPageSeo(this.seoPage, !this.catalogError && this.arrItems.length > 0);
    if (isPlatformBrowser(this.platformId) && !this.pageStoriesLoaded) {
      this.pageStoriesLoaded = true;
      this.methodservice.tStoriesHome.emit([]);
      if (this.arrItems.length > 0) this.getStories();
    }
  }

  private updateLocationLinks(): void {
    this.locationLinks = this.buildLocationLinks();
  }

  private buildLocationLinks(): Array<{ label: string; url: string }> {
    const activeCommuneIds = getActiveProfileLocationIds(
      this.arrItems as unknown as SitemapProfile[],
      'comuna'
    );

    const activeCityIds = getActiveProfileLocationIds(
      this.arrItems as unknown as SitemapProfile[],
      'ciudad'
    );
    const cities = this.oCiudades
      .filter(ciudad => ciudad.slug && activeCityIds.has(ciudad.id?.toString()));
    const communes = this.oComunas
      .filter(comuna => comuna.slug && activeCommuneIds.has(comuna.id?.toString()));
    const links = [...cities, ...communes]
      .filter(location => location.slug !== 'santiago')
      .map(location => ({ label: location.nombre, url: `/escort-${location.slug}` }));

    return [...new Map(links.map(link => [link.url, link])).values()]
      .sort((left, right) => left.label.localeCompare(right.label, 'es'));
  }
  getProfileUrl(item: Cliente): string {
    return `/profile/${item.iD_USUARIO}/${(item as any).slug ?? ''}`;
  }

  trackClient(_index: number, item: Cliente): unknown {
    return item.iD_USUARIO;
  }

  getProfileLocation(item: Cliente): string {
    const ciudadId = this.getLocationId((item as any).ciudad);
    const ciudadName = ciudadId !== null
      ? this.getCiudadName(ciudadId)
      : this.getLocationName((item as any).ciudad);

    if (ciudadId === 0 || this.isSantiago(ciudadName)) {
      const metroName = this.getMetroName((item as any).metro, (item as any).comuna);

      if (metroName !== '' && !this.isSinEstaciones(metroName)) {
        return metroName;
      }

      return this.getComunaName((item as any).comuna);
    }

    if (ciudadId !== null) {
      return ciudadName;
    }

    return ciudadName;
  }

  private getLocationName(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private getLocationId(value: unknown): number | null {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsedValue = Number(value);
      return Number.isNaN(parsedValue) ? null : parsedValue;
    }

    return null;
  }

  private getCiudadName(ciudadId: number): string {
    return this.oCiudades.find(ciudad => ciudad.id?.toString() === ciudadId.toString())?.nombre ?? '';
  }

  private getComunaName(comunaId: unknown): string {
    const normalizedComunaId = comunaId?.toString();
    return this.oComunas.find(comuna => comuna.id?.toString() === normalizedComunaId)?.nombre ?? '';
  }

  private getMetroName(metroId: unknown, comunaId: unknown): string {
    const normalizedMetroId = metroId?.toString().trim();
    const normalizedComunaId = comunaId?.toString().trim();

    if (!normalizedMetroId || normalizedMetroId === '0') {
      const metroSinEstaciones = this.oMetros.find(metro =>
        metro.idComuna?.toString() === normalizedComunaId && this.isSinEstaciones(metro.NombreMetro)
      );

      return metroSinEstaciones?.NombreMetro ?? '';
    }

    if (!normalizedComunaId) {
      return '';
    }

    const belongsToComuna = (metro: any) =>
      !normalizedComunaId || metro.idComuna?.toString() === normalizedComunaId;

    const metroById = this.oMetros.find(metro =>
      metro.idMetro?.toString() === normalizedMetroId && belongsToComuna(metro)
    );

    if (metroById) {
      return metroById.NombreMetro ?? '';
    }

    const metroByName = this.oMetros.find(metro =>
      metro.NombreMetro?.toString().trim().toLowerCase() === normalizedMetroId.toLowerCase()
      && belongsToComuna(metro)
    );

    return metroByName ? metroByName.NombreMetro : normalizedMetroId;
  }

  private isSantiago(value: string): boolean {
    return value.trim().toLowerCase() === 'santiago';
  }

  private isSinEstaciones(value: unknown): boolean {
    return value?.toString().trim().toLowerCase() === 'sin estaciones';
  }

  private scheduleStoriesLoad(): void {
    let timer: number | undefined;
    const scheduleRequest = () => {
      timer = window.setTimeout(() => {
        if (!this.destroyRef.destroyed) this.getStories();
      }, 250);
    };
    this.destroyRef.onDestroy(() => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener('load', scheduleRequest);
    });

    if (document.readyState === 'complete') {
      scheduleRequest();
    } else {
      window.addEventListener('load', scheduleRequest, { once: true });
    }
  }

  getStories() {
    this.api.GetAllActiveStoriesUser().pipe(
      timeout(6000),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (value: rStoriesHome) => {
        const stories = Array.isArray(value.oStories) ? value.oStories : [];
        const ids = new Set(this.arrItems.map(profile => String(profile.iD_USUARIO)));
        this.methodservice.tStoriesHome.emit(this.seoPage
          ? stories.filter(story => ids.has(String(story.iD_USUARIO))) : value.oStories);
      },
      error: err => {
        this.methodservice.tStoriesHome.emit([]);
        this.toastService.error('Error en cargar las historias!');
      }
    });
  }
}
