import { AnalyticsService } from './../service/analytics.service';
import { WebVisitService } from '../service/web-visit.service';
import { ActiveProfile, Cliente, ImageProfile, UidUser, Valoracion } from './../models/models.interface';
import { afterNextRender, Component, DestroyRef, inject, Inject, OnInit, PLATFORM_ID, REQUEST_CONTEXT, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ApiServices } from '../api/api.service';
import { ResponseClient, ResponseMediaFiles } from '../models/response.interface';
import { MethodService } from '../method/method.service';
import { GalleryLightbox } from "../gallery-lightbox/gallery-lightbox";
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ProfileTimeline } from '../profile-timeline/profile-timeline';
import { ToastService } from '../service/toast.service';
import { Stories } from '../stories/stories';
import { Review } from '../review/review';
import { HttpErrorResponse } from '@angular/common/http';
import { Identitycheck } from "../identitycheck/identitycheck";
import { StoryManager } from '../story-manager/story-manager';
import { SeoService } from '../service/seo.service';
import { SsrResponseService } from '../service/ssr-response.service';
import { Pagenotfound } from '../pagenotfound/pagenotfound';
import { catchError, distinctUntilChanged, forkJoin, map, Observable, of, Subject, switchMap, takeUntil, timeout } from 'rxjs';
import { ProfileLookup } from '../models/public-page-data';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PublicPageDataService } from '../service/public-page-data.service';

interface Files {
  mFile: File
}

type ProfileViewState = 'loading' | 'ready' | 'inactive' | 'error' | 'not-found';
//ProfileTimeline
@Component({
  selector: 'app-profile',
  imports: [CommonModule, RouterLink, GalleryLightbox, Stories, Review, Identitycheck, ProfileTimeline, StoryManager, Pagenotfound],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly publicData = inject(PublicPageDataService);
  private readonly identityChanges = new Subject<void>();

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
  public locationDirectoryUrl = '';
  public locationDirectoryName = '';
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
  private browserHydrated = false;
  private initialGalleryProfileId: number | null = null;
  private referenceCatalogsLoading = false;
  private referenceCatalogsLoaded = false;
  private initialReviewSummaryProfileId: number | null = null;
  private reviewSummaryLoadingProfileId: number | null = null;

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

  private readonly emptyProfile = { ...this.oCliente };

  constructor(
    private router: Router,
    private activateroute: ActivatedRoute,
    private api: ApiServices,
    private methodservice: MethodService,
    private toastService: ToastService,
    private analyticsService: AnalyticsService,
    private webVisitService: WebVisitService,
    private seoService: SeoService,
    private ssrResponse: SsrResponseService,
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(REQUEST_CONTEXT) private requestContext: unknown
  ) {
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(() => {
        this.browserHydrated = true;
        this.loadInitialGalleryAfterHydration();
        this.loadReferenceCatalogsAfterHydration();
        this.loadInitialReviewSummaryAfterHydration();
      });
    }
  }

  ngOnInit(): void {
    this.isAdministrator = this.methodservice.getItemLocalStorage('cl.paramours.typeuser') === '0';
    this.methodservice.tInProcess.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data: string) => {
      if (data === 'P') {
        this.bHiddenProfileValided = true;
        this.isProfileActive = false;
        this.oCliente.estado = 'P';
      }
    });

    this.activateroute.paramMap.pipe(
      map(params => {
        const rawId = params.get('sUid') || this.methodservice.getItemLocalStorage('cl.paramours.sUid');
        const id = /^\d+$/.test(rawId || '') ? Number(rawId) : 0;
        this.analyticsService.trackEvent('view_profile', { profile_slug: params.get('sLug') });
        return Number.isSafeInteger(id) && id > 0 ? id : 0;
      }),
      distinctUntilChanged(),
      switchMap(id => {
        this.resetProfile(id);
        const profile$: Observable<ProfileLookup> = id ? this.publicData.profile(id, this.requestContext,
          this.isAdministrator || String(id) === this.methodservice.getItemLocalStorage('cl.paramours.sUid')) : of({ kind: 'missing' } as const);
        return profile$.pipe(
          switchMap(profile => profile.kind !== 'found'
            ? of({ id, profile, ciudades: [], comunas: [], metros: [] })
            : forkJoin({
              profile: of(profile),
              ciudades: this.api.getCiudades().pipe(timeout(6000)),
              comunas: this.api.getComunas().pipe(timeout(6000)),
              metros: this.api.getMetros().pipe(timeout(6000))
            }).pipe(map(data => {
              if (![data.ciudades, data.comunas, data.metros].every(Array.isArray)) throw new Error('Invalid location catalog');
              return { ...data, id };
            }))),
          catchError(() => of({ id, profile: { kind: 'unavailable' } as const, ciudades: [], comunas: [], metros: [] }))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ id, profile, ciudades, comunas, metros }) => {
      if (id !== this.uIdUser.sUid) return;
      if (profile.kind === 'missing') { this.markProfileNotFound(); return; }
      if (profile.kind === 'unavailable') {
        this.isProfileLoaded = true;
        this.profileViewState = 'error';
        this.ssrResponse.setUnavailable();
        this.seoService.setUnavailableSeo();
        return;
      }
      if (Number(profile.profile.iD_USUARIO) !== id) return;
      this.oCliente = profile.profile;
      this.oCiudades = ciudades;
      this.oComunas = comunas;
      this.oMetros = metros;
      const ownId = this.methodservice.getItemLocalStorage('cl.paramours.sUid');
      const ownType = this.methodservice.getItemLocalStorage('cl.paramours.typeuser');
      this.isOwner = !(ownId === String(id) && ownType === '2');
      this.isProfileUser = ownId === String(id) && ownType === '3';
      this.proFileImg = this.oCliente.fotO_PERFIL
        ? this.sUrlRps + this.oCliente.fotO_PERFIL
        : this.sUrlRps + (this.oCliente.tipo === '2' ? 'avatar_anunciante.png' : 'avatar_visitante.png');
      this.isProfileActive = this.oCliente.estado === 'V';
      this.bHiddenProfileValided = !['V', 'N'].includes(this.oCliente.estado);
      if (this.oCliente.horariO_ATENCION != null && this.oCliente.horariO_ATENCION.toString() !== '') {
        this.hAtencion = this.oCliente.horariO_ATENCION === 0 ? 'Full Time' : 'Part Time';
      }
      this.isProfileLoaded = true;
      this.resolveReferenceDetails();
      if (this.isOwner && !this.isAdministrator && !this.isProfileActive) {
        this.profileViewState = 'inactive';
        this.seoService.setInactiveProfileSeo(this.buildProfileUrl());
        return;
      }
      this.profileViewState = 'ready';
      this.updateLocationDetailsAndSeo();
      this.loadInitialReviewSummaryAfterHydration();
      this.loadInitialGalleryAfterHydration();
      this.loadReferenceCatalogsAfterHydration();
    });
  }

  private resetProfile(id: number): void {
    this.identityChanges.next();
    this.uIdUser = { sUid: id };
    this.oCliente = { ...this.emptyProfile };
    this.isOwner = true;
    this.isProfileUser = false;
    this.isProfileActive = false;
    this.isProfileBlocked = false;
    this.bHiddenProfileValided = true;
    this.isProfileLoaded = false;
    this.profileViewState = 'loading';
    this.proFileImg = null;
    this.locationDirectoryName = '';
    this.locationDirectoryUrl = '';
    this.ciudad = []; this.comuna = []; this.metro = [];
    this.nacionalidad = []; this.genero = []; this.colorojo = [];
    this.colorcabello = []; this.biotipo = [];
    this.hAtencion = '';
    this.iReviewCount = 0; this.dValReview = undefined;
    this.oValoracion = { ...this.oValoracion, iD_USUARIO: 0, valoracion: '' };
    this.initialGalleryProfileId = null;
    this.initialReviewSummaryProfileId = null;
    this.reviewSummaryLoadingProfileId = null;
    this.mostrarModal = false;
    this.methodservice.tMediaFiles.emit([]);
  }

  private markProfileNotFound(): void {
    this.isProfileLoaded = true;
    this.profileViewState = 'not-found';
    this.ssrResponse.setNotFound();
    this.seoService.applyStaticRouteSeo('/404');
  }

  get profileHeading(): string {
    const profileName = this.oCliente.nombrE_USUARIO?.trim() || 'Perfil';
    const serviceName = this.oCliente.genero?.toString() === '0' ? 'Masajista' : 'Escort';
    return `${profileName}, ${serviceName} en ${this.locationDirectoryName || 'Santiago'}`;
  }

  get profileImageAlt(): string {
    const profileName = this.oCliente.nombrE_USUARIO?.trim() || 'Perfil';
    return this.locationDirectoryName ? `${profileName} en ${this.locationDirectoryName}` : `${profileName} en Santiago`;
  }

  get showInactiveProfileMessage(): boolean {
    return this.profileViewState === 'inactive';
  }

  get canEditProfile(): boolean {
    return !this.isOwner || this.isAdministrator;
  }

  private loadInitialReviewSummaryAfterHydration(): void {
    const profileId = this.uIdUser.sUid;
    if (!this.browserHydrated || !this.isProfileLoaded || !profileId || this.initialReviewSummaryProfileId === profileId || this.profileViewState !== 'ready') {
      return;
    }

    this.initialReviewSummaryProfileId = profileId;
    this.loadReviewSummary(profileId);
  }

  Reviews(): void {
    this.loadInitialReviewSummaryAfterHydration();
  }

  private loadReviewSummary(profileId: number): void {
    if (this.reviewSummaryLoadingProfileId === profileId) {
      return;
    }

    this.reviewSummaryLoadingProfileId = profileId;
    const profileRequest = { sUid: profileId };

    forkJoin({
      count: this.api.GetCountReviewByUser(profileRequest).pipe(catchError(() => of(null))),
      rating: this.api.GetValReviewById(profileRequest).pipe(catchError(() => of(null)))
    }).pipe(takeUntil(this.identityChanges), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ count, rating }) => {
        if (this.uIdUser.sUid !== profileId) {
          this.clearReviewSummaryLoading(profileId);
          return;
        }

        if (count !== null) {
          this.iReviewCount = count;
        } else {
          this.toastService.error('Error al cargar el conteo de las valoraciones!');
        }

        if (rating !== null) {
          this.oValoracion = rating.oValReview;
          this.dValReview = Number.parseFloat(this.oValoracion.valoracion);
        } else {
          this.toastService.error('Error en cargar las valoraciones!');
        }

        this.clearReviewSummaryLoading(profileId);
      },
      error: () => this.clearReviewSummaryLoading(profileId)
    });
  }
  private clearReviewSummaryLoading(profileId: number): void {
    if (this.reviewSummaryLoadingProfileId === profileId) {
      this.reviewSummaryLoadingProfileId = null;
    }
  }
  toggleProfileStatus() {
    if (!this.isProfileActive) {
      this.ActiveProfileFrm.estado = 'V';
    }
    else if (this.isProfileActive) {
      this.ActiveProfileFrm.estado = 'N';
    }

    this.api.ActiveProfile(this.ActiveProfileFrm).pipe(
      takeUntil(this.identityChanges), takeUntilDestroyed(this.destroyRef)
    ).subscribe({
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

  private loadReferenceCatalogsAfterHydration(): void {
    if (!this.browserHydrated || !this.isProfileLoaded || this.referenceCatalogsLoading || this.referenceCatalogsLoaded) {
      return;
    }

    this.referenceCatalogsLoading = true;
    forkJoin({
      nacionalidades: this.api.getNaciones().pipe(catchError(() => of([]))),
      generos: this.api.getGeneros().pipe(catchError(() => of([]))),
      colorOjos: this.api.getColorOjos().pipe(catchError(() => of([]))),
      colorCabello: this.api.getColorCabello().pipe(catchError(() => of([]))),
      biotipos: this.api.getBiotipo().pipe(catchError(() => of([])))
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ nacionalidades, generos, colorOjos, colorCabello, biotipos }) => {
        this.oNacionalidades = nacionalidades as Array<any>;
        this.oGeneros = generos as Array<any>;
        this.oColorOjos = colorOjos as Array<any>;
        this.oColorCabellos = colorCabello as Array<any>;
        this.oBiotipos = biotipos as Array<any>;
        this.resolveReferenceDetails();
        this.referenceCatalogsLoaded = true;
        this.referenceCatalogsLoading = false;
      },
      error: () => {
        this.referenceCatalogsLoading = false;
      }
    });
  }

  private resolveReferenceDetails(): void {
    this.nacionalidad = this.getReferenceLabel(this.oNacionalidades, this.oCliente.nacionalidad, 'nacionalidad');
    this.genero = this.getReferenceLabel(this.oGeneros, this.oCliente.genero, 'nombre');
    this.colorojo = this.getReferenceLabel(this.oColorOjos, this.oCliente.colorojos, 'nombre');
    this.colorcabello = this.getReferenceLabel(this.oColorCabellos, this.oCliente.colorcabello, 'nombre');
    this.biotipo = this.getReferenceLabel(this.oBiotipos, this.oCliente.biotipo, 'nombre');
  }

  private getReferenceLabel(catalog: Array<any>, id: unknown, field: string): Array<any> {
    if (id === null || id === undefined || id.toString() === '') {
      return [];
    }

    return catalog
      .filter(item => item.id?.toString() === id.toString())
      .map(item => item[field]);
  }
  private loadInitialGalleryAfterHydration(): void {
    if (!this.browserHydrated || !this.isProfileLoaded || this.initialGalleryProfileId === this.uIdUser.sUid || this.profileViewState !== 'ready') {
      return;
    }

    this.initialGalleryProfileId = this.uIdUser.sUid;
    this.getMediaFiles();
  }

  getMediaFiles() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const profileId = this.uIdUser.sUid;
    this.api.getMediaFiles({ sUid: profileId }).pipe(
      takeUntil(this.identityChanges), takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data: ResponseMediaFiles) => {
        if (this.uIdUser.sUid !== profileId || this.profileViewState !== 'ready') return;
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

        this.api.updateLoadMediaFiles(frmData).pipe(
          takeUntil(this.identityChanges), takeUntilDestroyed(this.destroyRef)
        ).subscribe({
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
    if (this.isAdministrator) {
      this.router.navigate(['/settingaccount'], {
        queryParams: { uid: this.oCliente.iD_USUARIO }
      });
      return;
    }

    this.router.navigate(['/settingaccount']);
  }

  private updateLocationDetailsAndSeo(): void {
    if (!this.oCliente?.iD_USUARIO) return;

    const city = this.oCiudades.find(item => item.id?.toString() === this.oCliente.ciudad?.toString());
    const commune = this.oComunas.find(item => item.id?.toString() === this.oCliente.comuna?.toString());
    const metro = this.oMetros.find(item =>
      item.idComuna?.toString() === this.oCliente.comuna?.toString()
      && item.idMetro?.toString() === this.oCliente.metro?.toString()
    );

    this.ciudad = city ? [city.nombre] : [];
    this.comuna = this.oCliente.ciudad?.toString() === '0' && commune ? [commune.nombre] : [];
    this.metro = metro ? [metro.NombreMetro] : [];

    const location = this.oCliente.ciudad?.toString() === '0' && commune ? commune : city;
    this.locationDirectoryName = location?.nombre ?? '';
    this.locationDirectoryUrl = location?.slug ? `/escort-${location.slug}` : '';

    if (this.profileViewState === 'ready') {
      this.seoService.setProfileSeo(
        this.oCliente,
        this.buildProfileUrl(),
        this.getPublicProfileImageUrl(),
        this.locationDirectoryName,
        this.locationDirectoryUrl
      );
    }
  }

  private getPublicProfileImageUrl(): string {
    const fileName = this.oCliente.fotO_PERFIL?.trim();
    return fileName ? `${this.sUrlRps}${fileName}` : '';
  }

  private buildProfileUrl(): string {
    const officialSlug = String((this.oCliente as Cliente & { slug?: string }).slug || `Escort-${this.oCliente.nombrE_USUARIO || ''}`)
      .replace(/[\r\n]/g, '')
      .trim();
    const encodedSlug = encodeURIComponent(officialSlug).replace(/%2F/gi, '-');
    return `https://paramours.cl/profile/${encodeURIComponent(this.oCliente.iD_USUARIO.toString())}/${encodedSlug}`;
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
    if (files && files.length > 0) {
      Array.prototype.forEach.call(files, (file: File) => {

        const imageProfile: ImageProfile = {
          photoprofile: file
        }

        const frmData = new FormData();
        frmData.append('foto', imageProfile.photoprofile);
        target.value = '';
        const profileId = this.uIdUser.sUid;
        this.api.updateLoadPhotoProfile(frmData).pipe(
          takeUntil(this.identityChanges), takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: data => {
            if (this.uIdUser.sUid !== profileId || Number(data.oClient?.iD_USUARIO) !== profileId) return;
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
    this.webVisitService.registerEvent('CLICK_WHATSAPP', this.router.url);
    this.analyticsService.trackEvent('click_whatsapp', {
      click_whatsapp: this.oCliente.nombrE_USUARIO
    });
  }

  onClicPhone() {
    this.webVisitService.registerEvent('CLICK_PHONE', this.router.url);
    this.analyticsService.trackEvent('onClicPhone', {
      onClicPhone: this.oCliente.nombrE_USUARIO
    });
  }

  ngOnDestroy() {

  }

}
