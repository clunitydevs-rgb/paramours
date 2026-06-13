import { MethodService } from './../method/method.service';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ApiServices } from '../api/api.service';
import { ToastService } from '../service/toast.service';
import { ResponseClient } from '../models/response.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { ActiveProfile } from '../models/models.interface';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-manage-profile',
  imports: [CommonModule, FormsModule ],
  templateUrl: './manage-profile.html',
  styleUrl: './manage-profile.css'
})
export class ManageProfile implements OnInit {
  @ViewChild('htmlContent', { static: true }) contenedor!: ElementRef;
  sUrlRps: string = "https://demofilesblobazure.blob.core.windows.net/rpsfilescontainer/";
  proFileImg: string = this.sUrlRps + "avatar_anunciante.png";
  arrItems: Array<any> = [];
  nTotalClienteCount: number = 0;
  oData: any;
  textoBusqueda: string = '';

  iStateProfile: ActiveProfile = {
    Uid: '',
    estado: ''
  }

  constructor(
    private api: ApiServices,
    private router: Router,
    private renderer: Renderer2,
    private MethodService: MethodService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {

    if (this.MethodService.getItemLocalStorage("cl.paramours.typeuser") != '0') {
      this.toastService.error('Usted no tiene privilegios de administración');
      this.router.navigate(['/home']);
    } else
      this.getProfiles();

  }

  getProfiles() {
    this.api.GetManageProfile().subscribe({
      next: (data: ResponseClient) => {
        this.arrItems = [];
        this.oData = data.oClient;

        for (let items of this.oData) {
          this.arrItems.push(items);
        }

        if (this.arrItems.length > 0) {
          this.nTotalClienteCount = this.arrItems.length;
        }
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401)
          this.toastService.error('Tiempo de sesión expirado, por favor ingrese nuevamente!');
        else
          this.toastService.error('Estamos presentando problemas, por favor recarga de nuevo la pagina!');
      }
    });
  }

  get registrosFiltrados() {
    const texto = this.textoBusqueda.toLowerCase().trim();

    if (!texto) {
      return this.arrItems;
    }

    return this.arrItems.filter(item =>
      Object.values(item).some(valor =>
        String(valor ?? '').toLowerCase().includes(texto)
      )
    );
  }

  onPreviewImg(oFile: string): void {
    this.onCleanObject();
    oFile = ((oFile != null && oFile !== '') ? this.sUrlRps + oFile : this.proFileImg)
    this.onCreateObjectFile(oFile)
  }

  onCleanObject() {
    const contenedorEl = this.contenedor.nativeElement;
    const hijos = Array.from(contenedorEl.childNodes);
    hijos.forEach(hijo => {
      this.renderer.removeChild(contenedorEl, hijo);
    });
  }

  onCreateObjectFile(oFile: string) {

    const img = this.renderer.createElement('img');
    this.renderer.setAttribute(img, 'src', oFile);
    this.renderer.addClass(img, 'h-100');
    this.renderer.appendChild(this.contenedor.nativeElement, img);

  }

  onChangeStateProfile(uId: string, estado: string) {
    this.iStateProfile.Uid = uId;
    this.iStateProfile.estado = estado;

    this.api.ChangeStateProfile(this.iStateProfile).subscribe({
      next: (data: ResponseClient) => {
        this.getProfiles();
        this.toastService.success('Cambio realizado con exito!');
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401)
          this.toastService.error('Tiempo de sesión expirado, por favor ingrese nuevamente!');
        else
          this.toastService.error('Error al cambiar el estado del perfil!');
      }
    });

  }

}
