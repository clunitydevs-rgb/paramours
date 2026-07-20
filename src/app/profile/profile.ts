import { AnalyticsService } from './../service/analytics.service';
import { ActiveProfile, Cliente, ImageProfile, UidUser, Valoracion } from './../models/models.interface';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiServices } from '../api/api.service';
import { ResponseClient, ResponseMediaFiles, rValoracion } from '../models/response.interface';
import { MethodService } from '../method/method.service';
import { GalleryLightbox } from "../gallery-lightbox/gallery-lightbox";
import { CommonModule } from '@angular/common';
import { ProfileTimeline } from '../profile-timeline/profile-timeline';
import { ToastService } from '../service/toast.service';
import { Stories } from '../stories/stories';
import { Review } from '../review/review';
import { HttpErrorResponse } from '@angular/common/http';
import { Identitycheck } from "../identitycheck/identitycheck";
import { StoryManager } from '../story-manager/story-manager';
import { SeoService } from '../service/seo.service';

interface Files {
  mFile: File
}

type ProfileViewState = 'loading' | 'ready' | 'inactive' | 'error';
//ProfileTimeline
@Component({
  selector: 'app-profile',
  imports: [CommonModule, GalleryLightbox, Stories, Review, Identitycheck, ProfileTimeline, StoryManager],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {

  @ViewChild(Stories) private storiesComponent?: Stories;

  sUrlRps: string = "https://paramoursfilesblobazure.blob.core.windows.net/rpsfilescontainer/";
  proFileImg: string | null = null;
  public isOwner: boolean = true;
  public isProfileActive: boolean = false;
  public isProfileBlocked: boolean = false;
  public isProfileUser: boolean = false;
  public bHiddenProfileValided: boolean = true;
  public isProfileLoaded: boolean = false;
  public isAdministrator: boolean = false;
  public profileViewState: ProfileViewState = 'loading';
  // dssfs
  nCount = 0;

  public oCiudades: Array<any> = [];
  public ciudad: Array<any> = [];

  public oComunas: Array<any> = [];
  public comuna: Array<any> = [];

  public oMetros: Array<any> = [];
  public metro: Array<any> = [];

  public oNacionalidades: Array<any> = [];
  public nacionalidad: Array<any> = [];

  public oGeneros: Array<any> = [];
  public genero: Array<any> = [];

  public oColorOjos: Array<any> = [];
  public colorojo: Array<any> = [];

  public oColorCabellos: Array<any> = [];
  public colorcabello: Array<any> = [];

  public oBiotipos: Array<any> = [];
  public biotipo: Array<any> = [];

  public hAtencion: string = '';

  public iReviewCount: number = 0;
  public dValReview: any;

  uIdUser: UidUser = {
    sUid: 0
  }
  public oCliente: Cliente = {
    iD_USUARIO: 0,
    nombrE_USUARIO: '',
    fechA_NACIMIENTO: '',
    edad: 0,
    correo: '',
    celular: '',
    genero: '',
    nacionalidad: 0,
    medidas: '',
    altura: '',
    peso: 0,
    horariO_ATENCION: 0,
    horariO_PART_TIME: '',
    ciudad: 0,
    comuna: 0,
    metro: 0,
    valor: 0,
    colorojos: 0,
    colorcabello: 0,
    biotipo: 0,
    descripcion: '',
    estado: '',
    tipo: '',
    fechA_CREACION: '',
    fechA_ACTIVACION: '',
    fotO_PERFIL: ''
  }

  public oValoracion: Valoracion = {
    iD_VALORACION: 0,
    iD_USUARIO: 0,
    tT_UNA_ESTRELLA: 0,
    tT_DOS_ESTRELLAS: 0,
    tT_TRES_ESTRELLAS: 0,
    tT_CUATRO_ESTRELLAS: 0,
    tT_CINCO_ESTRELLAS: 0,
    valoracion: '',
    fecha: ''
  }

  ActiveProfileFrm: ActiveProfile = {
    Uid: '',
    estado: ''
  }

  constructor(
    private router: Router,
    private activateroute: ActivatedRoute,
    private api: ApiServices,
    private methodservice: MethodService,
    private toastService: ToastService,
    private analyticsService: AnalyticsService,
    private seoService: SeoService
  ) { }

  ngOnInit(): void {

    this.isAdministrator = this.methodservice.getItemLocalStorage('cl.paramours.typeuser') === '0';

    this.activateroute.paramMap.subscribe({
      next: (params) => {
        let sUid = params.get('sUid');
        if (sUid != null && sUid != '') {
          this.uIdUser.sUid = parseInt(sUid);
          this.analyticsService.trackEvent('view_profile', {
            profile_slug: params.get('sLug')
          });

        } else {
          if ((this.uIdUser.sUid == 0) && (this.methodservice.getItemLocalStorage('cl.paramours.sUid') != null && this.methodservice.getItemLocalStorage('cl.paramours.sUid') != ''))
            this.uIdUser.sUid = parseInt(this.methodservice.getItemLocalStorage('cl.paramours.sUid'));
        }

        if (this.uIdUser.sUid && this.uIdUser.sUid !== 0) {
          this.LoadProfile();

          this.methodservice.tInProcess.subscribe((data: string) => {
            if (data === 'P') {
              this.bHiddenProfileValided = true;
              this.isProfileActive = false;
              this.oCliente.estado = 'P';
            }
          });


        } else {
          this.toastService.error('1.Usuario no encontrado!');
          this.router.navigate(['/404']);
        }
      },
      error: (err) => {
        console.error('2. Error al obtener parámetros de la ruta: ', err);
        this.toastService.error('Error al cargar el perfil!');
        this.router.navigate(['/404']);
      }

    });
  }

  LoadProfile() {
    this.isProfileLoaded = false;
    this.profileViewState = 'loading';

    this.api.getCiudades().subscribe(data => {
      for (let items of data) {
        this.oCiudades.push(items);
      }
    });

    this.api.getComunas().subscribe(data => {
      for (let items of data) {
        this.oComunas.push(items);
      }
    });

    this.api.getMetros().subscribe(data => {
      for (let items of data) {
        this.oMetros.push(items);
      }
    });

    this.api.getNaciones().subscribe(data => {
      for (let items of data) {
        this.oNacionalidades.push(items);
      }
    });

    this.api.getGeneros().subscribe(data => {
      for (let items of data) {
        this.oGeneros.push(items);
      }
    });

    this.api.getColorOjos().subscribe(data => {
      for (let items of data) {
        this.oColorOjos.push(items);
      }
    });

    this.api.getColorCabello().subscribe(data => {
      for (let items of data) {
        this.oColorCabellos.push(items);
      }
    });

    this.api.getBiotipo().subscribe(data => {
      for (let items of data) {
        this.oBiotipos.push(items);
      }
    });

    this.api.getClientById(this.uIdUser).subscribe({
      next: (data: ResponseClient) => {
        if (data.ncoderror == '0') {
          this.oCliente = data.oClient;

          if (((this.methodservice.getItemLocalStorage("cl.paramours.sUid") != null) && (this.methodservice.getItemLocalStorage("cl.paramours.sUid") != '')) && (this.methodservice.getItemLocalStorage('cl.paramours.sUid') == this.oCliente.iD_USUARIO.toString())) {
            if (this.methodservice.getItemLocalStorage("cl.paramours.typeuser") === "2")
              this.isOwner = false;

            if (this.methodservice.getItemLocalStorage("cl.paramours.typeuser") === "3") {
              this.isProfileUser = true;
            }
            //this.methodservice.tShowMenu.emit(true);
          }

          if ((this.oCliente.fotO_PERFIL != null) && (this.oCliente.fotO_PERFIL != ''))
            this.proFileImg = this.sUrlRps + this.oCliente.fotO_PERFIL;
          else {
            if (this.oCliente.tipo === '2')
              this.proFileImg = this.sUrlRps + 'avatar_anunciante.png';
            else
              this.proFileImg = this.sUrlRps + 'avatar_visitante.png';
          }

          if (this.oCliente.ciudad != null && this.oCliente.ciudad.toString() != '')
            this.ciudad = this.oCiudades.filter(e => e.id.toString() === this.oCliente.ciudad.toString()).map(e => e.nombre);

          if (this.oCliente.ciudad?.toString() === '0' && this.oCliente.comuna != null && this.oCliente.comuna.toString() != '')
            this.comuna = this.oComunas.filter(e => e.id.toString() === this.oCliente.comuna.toString()).map(e => e.nombre);
          else
            this.comuna = [];

          if (this.oCliente.metro != null && this.oCliente.metro.toString() != '')
            this.metro = this.oMetros.filter(e => e.idComuna.toString() === this.oCliente.comuna.toString() && e.idMetro.toString() === this.oCliente.metro.toString()).map(e => e.NombreMetro);

          if (this.oCliente.nacionalidad != null && this.oCliente.nacionalidad.toString() != '')
            this.nacionalidad = this.oNacionalidades.filter(e => e.id.toString() === this.oCliente.nacionalidad.toString()).map(e => e.nacionalidad);

          if (this.oCliente.genero != null && this.oCliente.genero.toString() != '')
            this.genero = this.oGeneros.filter(e => e.id.toString() === this.oCliente.genero.toString()).map(e => e.nombre);

          if (this.oCliente.colorojos != null && this.oCliente.colorojos.toString() != '')
            this.colorojo = this.oColorOjos.filter(e => e.id.toString() === this.oCliente.colorojos.toString()).map(e => e.nombre);

          if (this.oCliente.colorcabello != null && this.oCliente.colorcabello.toString() != '')
            this.colorcabello = this.oColorCabellos.filter(e => e.id.toString() === this.oCliente.colorcabello.toString()).map(e => e.nombre);

          if (this.oCliente.biotipo != null && this.oCliente.biotipo.toString() != '')
            this.biotipo = this.oBiotipos.filter(e => e.id.toString() === this.oCliente.biotipo.toString()).map(e => e.nombre)

          if (this.oCliente.horariO_ATENCION != null && this.oCliente.horariO_ATENCION.toString() != '')
            this.hAtencion = (this.oCliente.horariO_ATENCION === 0 ? 'Full Time' : 'Part Time');

          switch (this.oCliente.estado) {
            case 'V':
              this.bHiddenProfileValided = false;
              this.isProfileActive = true;
              break;
            case 'N':
              this.bHiddenProfileValided = false;
              this.isProfileActive = false;
              break;
            case 'P':
              this.bHiddenProfileValided = true;
              this.isProfileActive = false;
              break;
          }
          this.isProfileLoaded = true;

          if (this.isOwner && !this.isAdministrator && this.oCliente.estado !== 'V') {
            this.profileViewState = 'inactive';
            this.seoService.setInactiveProfileSeo(this.buildProfileUrl());
            return;
          }

          this.profileViewState = 'ready';
          this.seoService.setProfileSeo(
            this.oCliente,
            this.buildProfileUrl(),
            this.proFileImg
          );

          this.Reviews();
          this.getMediaFiles();

        } else {
          this.isProfileLoaded = true;
          this.profileViewState = 'error';
          this.toastService.error('Perfil no encontrado!');
        }
      },
      error: (err) => {
        this.isProfileLoaded = true;
        this.profileViewState = 'error';
        this.toastService.error('Error en cargar el perfil!');
      }

    });

  }

  get showInactiveProfileMessage(): boolean {
    return this.profileViewState === 'inactive';
  }

  Reviews() {
    this.api.GetCountReviewByUser(this.uIdUser).subscribe({
      next: (data: number) => {
        this.iReviewCount = data;
      },
      error: err => {
        this.toastService.error('Error al cargar el conteo de las valoraciones!');
      }
    });

    this.api.GetValReviewById(this.uIdUser).subscribe({
      next: (data: rValoracion) => {
        this.oValoracion = data.oValReview;
        this.dValReview = Number.parseFloat(this.oValoracion.valoracion);
      },
      error: err => {
        this.toastService.error('Error al cargar las valoraciones!');
      }
    });
  }

  toggleProfileStatus() {
    if (!this.isProfileActive) {
      this.ActiveProfileFrm.estado = 'V';
    }
    else if (this.isProfileActive) {
      this.ActiveProfileFrm.estado = 'N';
    }

    this.api.ActiveProfile(this.ActiveProfileFrm).subscribe({
      next: (data: ResponseClient) => {
        if (!this.isProfileActive) {
          this.isProfileActive = true;
        }
        else if (this.isProfileActive) {
          this.isProfileActive = false;
        }
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401)
          this.toastService.error('Tiempo de sesión expirado, por favor ingrese nuevamente!');
        else
          this.toastService.error('Error al cambiar el estado del perfil!');
      }
    });
  }

  getMediaFiles() {
    this.api.getMediaFiles(this.uIdUser).subscribe({
      next: (data: ResponseMediaFiles) => {
        this.methodservice.tMediaFiles.emit(data.oMediaFiles);
      },
      error: err => {
        this.toastService.error('Error en cargar las imagenes!');
      }
    });
  }

  refreshStories() {
    this.storiesComponent?.refreshStories();
  }

  error_srv: string = '';
  CapturarImagenes(event: Event) {
    const target = event.target as HTMLInputElement;
    const files: FileList | null = target.files;

    if (files!.length > 0 && files != null) {
      Array.prototype.forEach.call(files, (file: File) => {

        const mediaFiles: Files = {
          mFile: file,
        }

        const frmData = new FormData();
        frmData.append('Achivos', file, file.name);
        //frmData.append('Achivos', mediaFiles.mFile);

        this.api.updateLoadMediaFiles(frmData).subscribe({
          next: data => {
            this.getMediaFiles();
          },
          error: (err: HttpErrorResponse) => {
            if (err.status === 401) {
              this.toastService.error('Tiempo de sesión expirado, por favor ingrese nuevamente!');
            }
            else if (err.status === 400) {
              this.toastService.error('Solicitud inválida al subir las imágenes!');
              this.error_srv = err.status.toString() + ' - ' + err.statusText + ' - ' + err.error?.message;
            }
            else if (err.status === 0) {
              this.toastService.error('No se pudo subir el video. Revisa tamaño, conexión o formato del archivo.');
            }
            else {
              this.toastService.error('Problemas con los servicios para subir las imagenes!');
              this.error_srv = err.status.toString() + ' - ' + err.statusText + ' - ' + err.error?.message;
            }
          }
        });
      })
    }
  }

  editProfile() {
    this.router.navigate(['/settingaccount'])
  }

  private buildProfileUrl(): string {
    const slug = this.activateroute.snapshot.paramMap.get('sLug') || this.oCliente.nombrE_USUARIO.replace(/\s+/g, '-');
    return `https://paramours.cl/profile/${this.oCliente.iD_USUARIO}/${slug}`;
  }

  public mostrarModal = false;
  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.Reviews();
  }

  CargarImgFotoPerfil(event: Event) {

    const target = event.target as HTMLInputElement;
    const files: FileList | null = target.files;
    if (files!.length > 0 && files != null) {
      Array.prototype.forEach.call(files, (file: File) => {

        const imageProfile: ImageProfile = {
          photoprofile: file
        }

        const frmData = new FormData();
        frmData.append('foto', imageProfile.photoprofile);
        this.api.updateLoadPhotoProfile(frmData).subscribe({
          next: data => {
            this.oCliente = data.oClient;
            this.proFileImg = this.sUrlRps + this.oCliente.fotO_PERFIL;
          },
          error: (err: HttpErrorResponse) => {
            if (err.status === 401)
              this.toastService.error('Tiempo de sesión expirado, por favor ingrese nuevamente!');
            else
              this.toastService.error('Problema con el servicio para actualizar la foto del perfil!');
          }
        });

      });
    }
  }

  onClickWsp() {
    this.analyticsService.trackEvent('click_whatsapp', {
      click_whatsapp: this.oCliente.nombrE_USUARIO
    });
  }

  onClicPhone() {
    this.analyticsService.trackEvent('onClicPhone', {
      onClicPhone: this.oCliente.nombrE_USUARIO
    });
  }

  ngOnDestroy() {

  }

}
