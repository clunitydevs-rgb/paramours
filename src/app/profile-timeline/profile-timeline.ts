import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, HostListener, Inject, Input, OnChanges, PLATFORM_ID, Renderer2, SimpleChanges, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiServices } from '../api/api.service';
import { objId, PublicationForm, UidUser } from '../models/models.interface';
import { ResponseMsg, rPublications } from '../models/response.interface';
import { ToastService } from '../service/toast.service';
import { ProfilePostEditor } from '../profile-post-editor/profile-post-editor';

@Component({
  selector: 'app-profile-timeline',
  imports: [CommonModule, ProfilePostEditor],
  templateUrl: './profile-timeline.html',
  styleUrl: './profile-timeline.css'
})
export class ProfileTimeline implements OnChanges {
  @Input() iUser: number | null = null;
  @Input() sNomUser: string | null = null;
  @Input() sUrlProfile: string | null = null;
  @Input() showDelete: boolean | null = null;
  @ViewChild('htmlContent', { static: true }) contenedor!: ElementRef;

  sUrlRps: string = 'https://paramoursfilesblobazure.blob.core.windows.net/rpsfilescontainer/';
  ArraPublications: Array<any> = [];
  pageIndex: number = 0;
  totalPages: number = 0;
  PostExecute: boolean = true;
  private loadedUserId: number | null = null;

  public oId: objId = {
    iId: 0
  }

  uIdUser: UidUser = {
    sUid: 0
  }

  publication: PublicationForm = {
    sUid: 0,
    pageIndex: 1,
    pageSize: 5
  }

  constructor(
    public sanitizer: DomSanitizer,
    private api: ApiServices,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object,
    private toastService: ToastService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['iUser']) {
      this.loadInitialPublications();
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= docHeight && this.PostExecute) {
      this.PostExecute = false;
      this.LoadPublications();
    }
  }

  LoadPublications(resetTimeline: boolean = false) {
    if (this.iUser != null) {
      if (resetTimeline) {
        this.resetTimeline();
      }

      this.publication.sUid = this.iUser;
      this.publication.pageIndex = this.pageIndex + 1;
      this.publication.pageSize = 5;

      this.api.getPaginationPublicationsById(this.publication).subscribe({
        next: (data: rPublications) => {
          this.pageIndex++;
          const oData = Object.values(data.post);

          this.totalPages = data.totalPages;

          for (const items of oData) {
            this.ArraPublications.push(items);
          }

          if (this.pageIndex < this.totalPages) {
            this.PostExecute = true;
          }
        },
        error: () => {
          this.toastService.error('Error en cargar las publicaciones de contenido!');
        }
      });
    }
  }

  private loadInitialPublications() {
    if (typeof this.iUser !== 'number' || this.iUser <= 0 || this.loadedUserId === this.iUser) {
      return;
    }

    this.loadedUserId = this.iUser;
    this.LoadPublications(true);
  }

  private resetTimeline() {
    this.ArraPublications = [];
    this.pageIndex = 0;
    this.totalPages = 0;
    this.PostExecute = false;
  }

  onPreviewImg(index: number): void {
    this.onCleanObject();
    this.onCreateObjectFile(this.sUrlRps + this.ArraPublications[index].noM_MEDIA, this.ArraPublications[index].mediA_TYPE);
  }

  onCleanObject() {
    const contenedorEl = this.contenedor.nativeElement;
    const hijos = Array.from(contenedorEl.childNodes);
    hijos.forEach(hijo => {
      this.renderer.removeChild(contenedorEl, hijo);
    });
  }

  onCreateObjectFile(oFile: string, oType: string) {
    if (oType.indexOf('video') === -1) {
      const img = this.renderer.createElement('img');
      this.renderer.setAttribute(img, 'src', oFile);
      this.renderer.addClass(img, 'h-100');
      this.renderer.appendChild(this.contenedor.nativeElement, img);
    }

    if (oType.indexOf('video') >= 0) {
      const video = this.renderer.createElement('video');
      this.renderer.setAttribute(video, 'src', oFile);
      this.renderer.setAttribute(video, 'controls', '');
      this.renderer.setAttribute(video, 'autoplay', '');
      this.renderer.setAttribute(video, 'muted', '');
      this.renderer.addClass(video, 'gallery-video');
      this.renderer.appendChild(this.contenedor.nativeElement, video);
    }
  }

  SanitizedHTML(html: any): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  onDeletePublication(idPublication: number, index: number) {
    this.oId.iId = idPublication;

    this.api.DeletePublication(this.oId).subscribe({
      next: (data: ResponseMsg) => {
        if (isPlatformBrowser(this.platformId)) {
          const oComment = document.getElementById('commnet' + index) as HTMLDivElement;
          if (oComment) {
            oComment.remove();
            this.toastService.success('Contenido eliminado!');
          }
        }
      },
      error: () => {
        this.toastService.error('Error al eliminar contenido!');
      }
    });
  }
}
