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
import { EMPTY, catchError, timeout } from 'rxjs';

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
  lanzamientoMensajes: string[] = [
    'Nuevos perfiles cada semana',
    'Etapa de lanzamiento activa',
    'Anunciantes en proceso de incorporacion'
  ];

  constructor(
    private api: ApiServices,
    private methodservice: MethodService,
    private toastService: ToastService,
    @Inject(PLATFORM_ID) private platformId: object
  ) { }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.api.getClients().pipe(
      timeout(6000),
      catchError(() => {
        this.arrItems = [];
        this.nTotalClienteCount = 0;
        return EMPTY;
      })
    ).subscribe({
      next: (data: ResponseClient) => {
        const responseClients = data.oClient as unknown;
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
    const comuna = this.getLocationName((item as any).comuna);
    const ciudad = this.getLocationName((item as any).ciudad);
    return [comuna, ciudad].filter(Boolean).join(', ');
  }

  private getLocationName(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
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
