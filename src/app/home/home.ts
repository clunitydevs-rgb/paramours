import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiServices } from '../api/api.service';
import { ToastService } from '../service/toast.service';
import { ResponseClient, rStoriesHome } from '../models/response.interface';
import { Storieshome } from "../storieshome/storieshome";
import { MethodService } from '../method/method.service';
import { Cliente } from '../models/models.interface';
import { EMPTY, catchError, forkJoin, of, timeout } from 'rxjs';
import { SeoService } from '../service/seo.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, Storieshome],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  //sUrlRps: string = "https://demofilesblobazure.blob.core.windows.net/rpsfilescontainer/";
  sUrlRps: string = "https://paramoursfilesblobazure.blob.core.windows.net/rpsfilescontainer/";
  proFileImg: string = this.sUrlRps + "avatar_anunciante.png";
  arrItems: Cliente[] = [];
  nTotalClienteCount: number = 0;
  oData: Cliente[] = [];
  oCiudades: Array<any> = [];
  oComunas: Array<any> = [];
  oMetros: Array<any> = [];
  lanzamientoMensajes: string[] = [
    'Nuevos perfiles cada semana',
    'Etapa de lanzamiento activa',
    'Chicas en proceso de incorporacion'
  ];

  constructor(
    private api: ApiServices,
    private methodservice: MethodService,
    private toastService: ToastService,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: object
  ) { }

  ngOnInit(): void {
    this.seoService.setHomeSeo();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    forkJoin({
      clients: this.api.getClients().pipe(
        timeout(6000),
        catchError(() => of(null))
      ),
      ciudades: this.api.getCiudades(),
      comunas: this.api.getComunas(),
      metros: this.api.getMetros()
    }).subscribe({
      next: ({ clients, ciudades, comunas, metros }) => {
        this.oCiudades = ciudades;
        this.oComunas = comunas;
        this.oMetros = metros;

        if (!clients) {
          this.arrItems = [];
          this.nTotalClienteCount = 0;
          return;
        }

        const responseClients = clients.oClient as unknown;
        const clientes = Array.isArray(responseClients) ? responseClients as Cliente[] : [];
        this.oData = clientes;
        this.arrItems = [...clientes];
        this.nTotalClienteCount = this.arrItems.length;

        if (this.arrItems.length > 0) {
          this.methodservice.delItenLocalStorage("cl.paramours.arrItems");
          this.methodservice.setItemLocalStorage("cl.paramours.arrItems", JSON.stringify(this.arrItems));
        }
      },
      error: err => {
        this.toastService.error('Estamos presentando problemas, por favor recarga de nuevo la pagina!');
      }
    });

    this.getStories();
  }

  getProfileUrl(item: Cliente): string {
    return `/profile/${item.iD_USUARIO}/${(item as any).slug ?? ''}`;
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

  getStories() {
    this.api.GetAllActiveStoriesUser().pipe(
      timeout(6000),
      catchError(() => EMPTY)
    ).subscribe({
      next: (value: rStoriesHome) => {
        this.methodservice.tStoriesHome.emit(value.oStories);
      },
      error: err => {
        this.toastService.error('Error en cargar las historias!');
      }
    });
  }
}
