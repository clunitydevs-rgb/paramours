import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, Input, Renderer2, ViewChild, Inject, PLATFORM_ID, OnInit, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';
import { ApiServices } from '../api/api.service';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MethodService } from '../method/method.service';
import { objId, PublicationForm, UidUser } from '../models/models.interface';
import { ResponseMsg, rPublications } from '../models/response.interface';
import { RichTextEditorModule, ToolbarService, LinkService, ImageService, HtmlEditorService, EmojiPickerService, RichTextEditorComponent, EmojiSettingsModel, QuickToolbarService, ToolbarSettingsModel } from '@syncfusion/ej2-angular-richtexteditor';
import { ToolbarType } from '@syncfusion/ej2-richtexteditor';
import { ToastService } from '../service/toast.service';
import { AnalyticsService } from '../service/analytics.service';

@Component({
  selector: 'app-profile-timeline',
  imports: [CommonModule, ReactiveFormsModule, RichTextEditorModule],
  templateUrl: './profile-timeline.html',
  styleUrl: './profile-timeline.css',
  providers: [ToolbarService, LinkService, ImageService, HtmlEditorService, EmojiPickerService, QuickToolbarService]
})
export class ProfileTimeline implements OnInit, OnChanges {
  @Input() iUser: number | null = null;
  @Input() sNomUser: string | null = null;
  @Input() sUrlProfile: string | null = null;
  @Input() showDelete: boolean | null = null;
  @ViewChild('htmlContent', { static: true }) contenedor!: ElementRef;
  @ViewChild('emojiPickerEditor') public emojiPickerEditor!: RichTextEditorComponent;
  @ViewChild('exampleRTE') public componentObject!: RichTextEditorComponent;


  sUrlRps: string = "https://demofilesblobazure.blob.core.windows.net/rpsfilescontainer/";
  ArraPublications: Array<any> = [];
  fileToUpload: FileList | undefined;
  imageUrl: string | null = null; // Variable para almacenar la URL de datos
  videoUrl: SafeUrl | null = null;
  bImage: boolean = true;
  bVideo: boolean = true;
  pageIndex: number = 0;
  totalPages: number = 0;
  PostExecute : boolean = true;
  editorHeight = '250px';

  iload = 0;
  private btnElement!: HTMLElement | null;
  private loadedUserId: number | null = null;
  public htmlContent!: string;

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

  frmPublication = new FormGroup({
    descripcion: new FormControl()
  });
  new: any;

  constructor(
    public sanitizer: DomSanitizer,
    private api: ApiServices,
    private methodservice: MethodService,
    private btn: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object,
    private toastService: ToastService,
    private analyticsService : AnalyticsService
  ) { }

  ngOnInit(): void {
    this.setResponsiveEditor();
  }

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

    if (scrollTop + windowHeight >= docHeight) {
      // El usuario llegó al final del viewport

      if (this.PostExecute) {
        this.PostExecute = false;
        this.LoadPublications();
      }
    }
  }

  @HostListener('window:resize', [])
  onWindowResize() {
    this.setResponsiveEditor();
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
          let oData = Object.values(data.post);

          this.totalPages = data.totalPages;

          for (let items of oData) {
            this.ArraPublications.push(items);
          }

          if(this.pageIndex < this.totalPages) {
            this.PostExecute = true;
          }   

        },
        error: (err) => {
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
    this.onCreateObjectFile(this.sUrlRps + this.ArraPublications[index].noM_MEDIA, this.ArraPublications[index].mediA_TYPE)
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
      //this.renderer.setAttribute(img, 'alt', 'Imagen dinámica');
      this.renderer.addClass(img, 'h-100');
      this.renderer.appendChild(this.contenedor.nativeElement, img);
    }
    if (oType.indexOf('video') >= 0) {
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

  onFileSelected(event: any): void {
    this.bImage = true;
    this.bVideo = true;
    this.imageUrl = '';
    this.videoUrl = '';
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    //const file: File = event.target.files[0]; // Obtener el archivo seleccionado
    const file = input.files[0];

    if (file) {
      this.fileToUpload = input.files;
      if (file.type.indexOf('video') === -1) {
        const reader = new FileReader(); // Crear una nueva instancia de FileReader
        reader.onload = (e: any) => {
          this.imageUrl = e.target.result; // Asignar la URL de datos a la variable imageUrl
        };
        reader.readAsDataURL(file); // Leer el archivo como una URL de datos
        this.bImage = false;
      } else {
        const objectUrl = URL.createObjectURL(file);
        this.videoUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        this.bVideo = false;
      }
    }
  }

  SanitizedHTML(html: any): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  onPost() {
    if ((this.fileToUpload && this.fileToUpload.length > 0) || (this.componentObject.value! != '')) {
      const formData = new FormData();

      if (this.fileToUpload && this.fileToUpload.length > 0) {
        const file = this.fileToUpload[0]; // Obtén el primer archivo
        formData.append('Achivos', file);
      }

      //this.htmlContent = this.componentObject.getHtml();
      this.htmlContent = this.componentObject.getHtml();
      if (this.htmlContent != '')
        formData.append('sComentario', this.htmlContent);
      // Envía el archivo al backend. Asegúrate de que la URL sea la de tu API.
      this.api.addPublication(formData).subscribe({
        next: data => {
          this.componentObject.value = '';
          this.frmPublication.reset();
          this.fileToUpload = undefined;
          this.imageUrl = '';
          this.videoUrl = '';
          this.bImage = true;
          this.bVideo = true;
          const btnClose = this.btn.nativeElement.querySelector('#BtnCloseModal');
          if (btnClose) {
            btnClose.click(); // Programmatically click the button
          }

          this.LoadPublications(true);
          this.toastService.success('Publicación creada con éxito!');

          this.analyticsService.trackEvent('profile-timeline', {
          onPost: this.methodservice.getItemLocalStorage("cl.paramours.sUid")
        });
        },
        error: err => {
          this.toastService.error('Error en la publicación del contenido!');
        }
      });
    }
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
      error: err => {
        this.toastService.error('Error al eliminar contenido!');
      }
    });
  }

  private readonly desktopToolbarItems: ToolbarSettingsModel['items'] = [
    'Undo', 'Redo', '|',
    'EmojiPicker', 'Bold', 'Italic', 'Underline', '|',
    'FontSize', 'FontColor', 'BackgroundColor', '|',
    'Alignments', '|', 'OrderedList', 'UnorderedList', '|',
    'Indent', 'Outdent'
  ];

  private readonly mobileToolbarItems: ToolbarSettingsModel['items'] = [
    'EmojiPicker', '|',
    'Bold', 'Italic', 'Underline', '|',
    'FontColor', '|',
    'OrderedList', 'UnorderedList', '|',
    'Undo', 'Redo'
  ];

  public CustomToolbar: ToolbarSettingsModel = {
    type: ToolbarType.Scrollable,
    items: this.desktopToolbarItems
  };

  private setResponsiveEditor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const isMobile = window.innerWidth <= 576;
    this.editorHeight = isMobile ? '210px' : '250px';
    this.CustomToolbar = {
      type: ToolbarType.Scrollable,
      items: isMobile ? this.mobileToolbarItems : this.desktopToolbarItems
    };
  }

  public emojiPickerSettings: EmojiSettingsModel = {
    iconsSet: [{
      name: 'Smilies & People', code: '1F600', iconCss: 'e-emoji',
      icons: [{ code: '1F600', desc: 'Grinning face' },
      { code: '1F602', desc: 'Face with tears of joy' },
      { code: '1F607', desc: 'Smiling face with halo' },
      { code: '1F608', desc: 'Smiling face with horns' },
      { code: '1F609', desc: 'Winking face' },
      { code: '1F60D', desc: 'Smiling face with heart-eyes' },
      { code: '1F618', desc: 'Face blowing a kiss' },
      { code: '1F617', desc: 'Kissing face' },
      { code: '1F60E', desc: 'Smiling face with sunglasses' },
      { code: '1F613', desc: 'Face with cold sweat' },
      { code: '1F621', desc: 'Pouting face' },
      { code: '1F620', desc: 'Angry face' },
      { code: '1F62D', desc: 'Loudly crying face' },
      { code: '1F631', desc: 'Face screaming in fear' },
      { code: '1F970', desc: 'Smiling face with hearts' },
      { code: '1F973', desc: 'Partying face' }
        /*{ code: '1F603', desc: 'Grinning face with big eyes' },
        { code: '1F604', desc: 'Grinning face with smiling eyes' },
        { code: '1F606', desc: 'Grinning squinting face' },
        { code: '1F605', desc: 'Grinning face with sweat' },
        
        { code: '1F923', desc: 'Rolling on the floor laughing' },
        { code: '1F60A', desc: 'Smiling face with smiling eyes' },
        */
      ]
    }, {
      name: 'Animals & Nature', code: '1F435', iconCss: 'e-animals',
      icons: [{ code: '1F436', desc: 'Dog face' },
      { code: '1F431', desc: 'Cat face' },
      { code: '1F42D', desc: 'Mouse face' },
      { code: '1F439', desc: 'Hamster face' },
      { code: '1F430', desc: 'Rabbit face' },
      { code: '1F98A', desc: 'Fox face' }]
    }, {
      name: 'Food & Drink', code: '1F347', iconCss: 'e-food-and-drinks',
      icons: [{ code: '1F34E', desc: 'Red apple' },
      { code: '1F34C', desc: 'Banana' },
      { code: '1F352', desc: 'Cherries' },
      { code: '1F351', desc: 'Peach' },
      { code: '1F353', desc: 'Strawberry' },
      { code: '1F965', desc: 'Avocado' },
      { code: '1F95D', desc: 'Coconut' },
      { code: '1F96D', desc: 'Mango' },
      { code: '1F346', desc: 'Eggplant' },
      { code: '1F952', desc: 'Cucumber' },
      { code: '1F344', desc: 'Mushroom' },
      { code: '1F354', desc: 'Hamburger' }]
    }, {
      name: 'Activities', code: '1F383', iconCss: 'e-activities',
      icons: [{ code: '26BD', desc: 'Soccer ball' },
      { code: '1F3C0', desc: 'Basketball' },
      { code: '1F3C8', desc: 'American football' },
      { code: '26BE', desc: 'Baseball' },
      { code: '1F3BE', desc: 'Tennis' },
      { code: '1F3D0', desc: 'Volleyball' },
      { code: '1F3C9', desc: 'Rugby football' }]
    }, {
      name: 'Travel & Places', code: '1F30D', iconCss: 'e-travel-and-places',
      icons: [{ code: '2708', desc: 'Airplane' },
      { code: '1F697', desc: 'Automobile' },
      { code: '1F695', desc: 'Taxi' },
      { code: '1F6B2', desc: 'Bicycle' },
      { code: '1F68C', desc: 'Bus' }]
    }, {
      name: 'Objects', code: '1F507', iconCss: 'e-objects', icons: [{ code: '1F4A1', desc: 'Light bulb' },
      { code: '1F526', desc: 'Flashlight' },
      { code: '1F4BB', desc: 'Laptop computer' },
      { code: '1F5A5', desc: 'Desktop computer' },
      { code: '1F5A8', desc: 'Printer' },
      { code: '1F4F7', desc: 'Camera' },
      { code: '1F4F8', desc: 'Camera with flash' },
      { code: '1F4FD', desc: 'Film projector' }]
    }, {
      name: 'Symbols', code: '1F3E7', iconCss: 'e-symbols', icons: [{ code: '274C', desc: 'Cross mark' },
      { code: '2714', desc: 'Check mark' },
      { code: '26A0', desc: 'Warning sign' },
      { code: '1F6AB', desc: 'Prohibited' },
      { code: '2139', desc: 'Information' },
      { code: '267B', desc: 'Recycling symbol' },
      { code: '1F6AD', desc: 'No smoking' },
      { code: '1F5A4', desc: 'Black heart' },
      { code: '2764', desc: 'Red heart' },
      { code: '1F494', desc: 'Broken heart' },
      { code: '1F48B', desc: 'Kiss mark' },
      { code: '1F525', desc: 'Fire' },
      { code: '1F4A6', desc: 'Gota de agua' },
      { code: '1F4A3', desc: 'Bomba' },
      { code: '1F4A5', desc: 'Colision' },
      { code: '1F339', desc: 'Rosa' },
      { code: '1F33B', desc: 'Girasol' },
      { code: '1F340', desc: 'Trébol' }
      ]
    }]
  };
}
