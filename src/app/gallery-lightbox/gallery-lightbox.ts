import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, Input, Renderer2, ViewChild, Inject, PLATFORM_ID, HostListener, OnDestroy } from '@angular/core';
import { objId } from '../models/models.interface';
import { MethodService } from '../method/method.service';
import { ApiServices } from '../api/api.service';
import { ResponseMsg } from '../models/response.interface';
import { ToastService } from '../service/toast.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-gallery-lightbox',
  imports: [CommonModule],
  templateUrl: './gallery-lightbox.html',
  styleUrl: './gallery-lightbox.css'
})
export class GalleryLightbox implements OnDestroy {
  @ViewChild('htmlContent', { static: true }) contenedor!: ElementRef;
  @Input() showDelete: boolean | null = null;

  //sUrlRps: string = "https://demofilesblobazure.blob.core.windows.net/rpsfilescontainer/";
  sUrlRps: string = "https://paramoursfilesblobazure.blob.core.windows.net/rpsfilescontainer";
  galleryData: Array<any> = [];
  oData: any;
  htmlContent: any;
  currentIndex = 0;
  totalImageCount = 0;
  bShowFx: boolean = true;
  private mediaSubscription?: Subscription;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;

  public oId: objId = {
    iId: 0
  }

  constructor(
    private methodservice: MethodService,
    private api: ApiServices,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.mediaSubscription = this.methodservice.tMediaFiles.subscribe(data => {
      this.oData = data;
      this.galleryData = [];

      for (let items of this.oData) {
        this.galleryData.push(items);
      }

      this.totalImageCount = this.galleryData.length;
      this.bShowFx = this.galleryData.length === 0;

    })
  }

  ngOnDestroy() {
    this.mediaSubscription?.unsubscribe();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!isPlatformBrowser(this.platformId) || !this.isLightboxOpen()) {
      return;
    }

    if (event.key === 'ArrowRight') {
      this.onNext();
    }

    if (event.key === 'ArrowLeft') {
      this.onPrev();
    }

    if (event.key === 'Escape') {
      this.onCleanObject();
    }
  }

  onPreviewImg(index: number): void {
    this.currentIndex = index;
    this.onCleanObject();
    this.onCreateObjectFile(this.sUrlRps + this.galleryData[index].noM_MEDIA, this.galleryData[index].mediA_TYPE)
  }

  onCleanObject() {
    const contenedorEl = this.contenedor.nativeElement;
    const hijos = Array.from(contenedorEl.childNodes);
    hijos.forEach(hijo => {
      this.renderer.removeChild(contenedorEl, hijo);
    });
  }

  onDeleteImage(index: number): void {
    this.oId.iId = this.galleryData[index].iD_MEDIA;
    this.api.DeleteFile(this.oId).subscribe({
      next: (data: ResponseMsg) => {
        this.toastService.success('Imagen eliminada!');
        this.galleryData.splice(index, 1);
        this.totalImageCount = this.galleryData.length;
        this.bShowFx = this.galleryData.length === 0;
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401)
          this.toastService.error('Tiempo de sesión expirado, por favor ingrese nuevamente!');
        else
          this.toastService.error('Problemas con los servicios para eliminar la imagen!');
        //console.error(err);
      }
    });
  }

  onNext(): void {
    this.currentIndex = this.currentIndex + 1;
    if (this.currentIndex > this.galleryData.length - 1) {
      this.currentIndex = 0;
    }
    this.onCleanObject();
    this.onCreateObjectFile(this.sUrlRps + this.galleryData[this.currentIndex].noM_MEDIA, this.galleryData[this.currentIndex].mediA_TYPE)
  }

  onPrev(): void {
    this.currentIndex = this.currentIndex - 1;
    if (this.currentIndex < 0) {
      this.currentIndex = this.galleryData.length - 1;
    }
    this.onCleanObject();
    this.onCreateObjectFile(this.sUrlRps + this.galleryData[this.currentIndex].noM_MEDIA, this.galleryData[this.currentIndex].mediA_TYPE)

  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
    this.touchStartY = event.changedTouches[0].screenY;
    this.touchEndX = this.touchStartX;
    this.touchEndY = this.touchStartY;
  }

  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.touchEndY = event.changedTouches[0].screenY;
    this.handleSwipe();
  }

  private handleSwipe() {
    const diffX = this.touchStartX - this.touchEndX;
    const diffY = this.touchStartY - this.touchEndY;
    const threshold = 50;

    if (Math.abs(diffX) < threshold || Math.abs(diffX) < Math.abs(diffY)) {
      return;
    }

    if (diffX > 0) {
      this.onNext();
    } else {
      this.onPrev();
    }
  }

  onCreateObjectFile(oFile: string, oType: string) {
    if (oType.indexOf('video') === -1) {
      const img = this.renderer.createElement('img');
      this.renderer.setAttribute(img, 'src', oFile);
      //this.renderer.setAttribute(img, 'alt', 'Imagen dinámica');
      this.renderer.addClass(img, 'h-100');
      this.renderer.appendChild(this.contenedor.nativeElement, img);
    }
    if (oType.indexOf('video') >= 0) {
      //console.log(oFile);
      const video = this.renderer.createElement('video');
      this.renderer.setAttribute(video, 'src', oFile);
      //this.renderer.setAttribute(video, 'width', '320');
      //this.renderer.setAttribute(video, 'height', '240');
      this.renderer.setAttribute(video, 'controls', '');
      this.renderer.setAttribute(video, 'autoplay', '');
      this.renderer.setAttribute(video, 'muted', ''); // Necesario para autoplay en la mayoría de navegadores

      // 3. Opcional: estilos
      this.renderer.addClass(video, 'gallery-video');
      //this.renderer.setStyle(video, 'margin', '10px');
      //this.renderer.setStyle(video, 'border', '1px solid #999');

      // 4. Agregar al contenedor
      this.renderer.appendChild(this.contenedor.nativeElement, video);
    }
  }

  private isLightboxOpen(): boolean {
    const modal = document.getElementById('myModal');
    return !!modal?.classList.contains('show');
  }
}
