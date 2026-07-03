import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Inject, Output, PLATFORM_ID, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { EmojiPickerService, EmojiSettingsModel, HtmlEditorService, ImageService, LinkService, QuickToolbarService, RichTextEditorComponent, RichTextEditorModule, ToolbarService, ToolbarSettingsModel } from '@syncfusion/ej2-angular-richtexteditor';
import { ToolbarType } from '@syncfusion/ej2-richtexteditor';
import { ApiServices } from '../api/api.service';
import { MethodService } from '../method/method.service';
import { ToastService } from '../service/toast.service';
import { AnalyticsService } from '../service/analytics.service';

@Component({
  selector: 'app-profile-post-editor',
  imports: [CommonModule, ReactiveFormsModule, RichTextEditorModule],
  templateUrl: './profile-post-editor.html',
  styleUrl: './profile-post-editor.css',
  encapsulation: ViewEncapsulation.None,
  providers: [ToolbarService, LinkService, ImageService, HtmlEditorService, EmojiPickerService, QuickToolbarService]
})
export class ProfilePostEditor {
  @Output() posted = new EventEmitter<void>();
  @ViewChild('exampleRTE') public componentObject!: RichTextEditorComponent;

  fileToUpload: FileList | undefined;
  imageUrl: string | null = null;
  videoUrl: SafeUrl | null = null;
  bImage = true;
  bVideo = true;
  editorHeight = '250px';
  htmlContent = '';

  frmPublication = new FormGroup({
    descripcion: new FormControl()
  });

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
      { code: '1F973', desc: 'Partying face' }]
    }, {
      name: 'Symbols', code: '1F3E7', iconCss: 'e-symbols',
      icons: [{ code: '274C', desc: 'Cross mark' },
      { code: '2714', desc: 'Check mark' },
      { code: '26A0', desc: 'Warning sign' },
      { code: '2139', desc: 'Information' },
      { code: '1F5A4', desc: 'Black heart' },
      { code: '2764', desc: 'Red heart' },
      { code: '1F494', desc: 'Broken heart' },
      { code: '1F48B', desc: 'Kiss mark' },
      { code: '1F525', desc: 'Fire' },
      { code: '1F4A6', desc: 'Gota de agua' },
      { code: '1F339', desc: 'Rosa' }]
    }]
  };

  constructor(
    public sanitizer: DomSanitizer,
    private api: ApiServices,
    private methodservice: MethodService,
    private btn: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private toastService: ToastService,
    private analyticsService: AnalyticsService
  ) {
    this.setResponsiveEditor();
  }

  @HostListener('window:resize', [])
  onWindowResize() {
    this.setResponsiveEditor();
  }

  onFileSelected(event: any): void {
    this.bImage = true;
    this.bVideo = true;
    this.imageUrl = '';
    this.videoUrl = '';
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (file) {
      this.fileToUpload = input.files;
      if (file.type.indexOf('video') === -1) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imageUrl = e.target.result;
        };
        reader.readAsDataURL(file);
        this.bImage = false;
      } else {
        const objectUrl = URL.createObjectURL(file);
        this.videoUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        this.bVideo = false;
      }
    }
  }

  onPost() {
    if ((!this.fileToUpload || this.fileToUpload.length === 0) && this.componentObject.value! === '') {
      return;
    }

    const formData = new FormData();

    if (this.fileToUpload && this.fileToUpload.length > 0) {
      const file = this.fileToUpload[0];
      formData.append('Achivos', file);
    }

    this.htmlContent = this.componentObject.getHtml();
    if (this.htmlContent != '') {
      formData.append('sComentario', this.htmlContent);
    }

    this.api.addPublication(formData).subscribe({
      next: () => {
        this.componentObject.value = '';
        this.frmPublication.reset();
        this.fileToUpload = undefined;
        this.imageUrl = '';
        this.videoUrl = '';
        this.bImage = true;
        this.bVideo = true;
        const btnClose = this.btn.nativeElement.querySelector('#BtnCloseModal');
        if (btnClose) {
          btnClose.click();
        }

        this.posted.emit();
        this.toastService.success('Publicacion creada con exito!');

        this.analyticsService.trackEvent('profile-timeline', {
          onPost: this.methodservice.getItemLocalStorage('cl.paramours.sUid')
        });
      },
      error: () => {
        this.toastService.error('Error en la publicacion del contenido!');
      }
    });
  }

  private setResponsiveEditor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const isMobile = window.innerWidth <= 576;
    this.editorHeight = isMobile ? '180px' : '250px';
    this.CustomToolbar = {
      type: ToolbarType.Scrollable,
      items: isMobile ? this.mobileToolbarItems : this.desktopToolbarItems
    };
  }
}
