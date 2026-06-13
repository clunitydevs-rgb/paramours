import { CommonModule } from '@angular/common';
import { Component, ElementRef } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';
import { ApiServices } from '../api/api.service';
import { MethodService } from '../method/method.service';
import { ToastService } from '../service/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-identitycheck',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './identitycheck.html',
  styleUrl: './identitycheck.css'
})
export class Identitycheck {
  imageUrl: string | null = null; // Variable para almacenar la URL de datos
  videoUrl: SafeUrl | null = null;
  bImage: boolean = true;
  bVideo: boolean = true;
  isVisible: boolean = true;
  isPosting: boolean = false;
  selectedFileName: string | null = null;
  fileToUpload: FileList | undefined;

  frmStories = new FormGroup({
  });

  constructor(
    public sanitizer: DomSanitizer,
    private api: ApiServices,
    private methodservice: MethodService,
    private btn: ElementRef,
    private toastService: ToastService,
  ) { }

  onCloseModal() {
    this.imageUrl = null;
    this.bImage = true;
    this.bVideo = true;
    this.isVisible = true;
    this.isPosting = false;
    this.selectedFileName = null;
    this.fileToUpload = undefined;
    this.videoUrl = null;
  }

  triggerFileInput(fileInput: HTMLInputElement) {
    fileInput.value = '';
    fileInput.click();
  }

  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (file) {
      this.bImage = true;
      this.bVideo = true;
      this.imageUrl = '';
      this.videoUrl = '';
      this.selectedFileName = null;
      this.fileToUpload = input.files;
      this.selectedFileName = file.name;
      this.isVisible = false;
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

  SanitizedHTML(html: any): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  onPost() {

    if (this.fileToUpload && this.fileToUpload.length > 0) {
      this.isPosting = true;
      const formData = new FormData();

      if (this.fileToUpload && this.fileToUpload.length > 0) {
        const file = this.fileToUpload[0]; 
        formData.append('foto', file);
      }

      this.api.CheckIDUsuarioByClient(formData).subscribe({
        next: () => {
          this.methodservice.tInProcess.emit('P');
          this.frmStories.reset();
          this.fileToUpload = undefined;
          this.isPosting = false;
          this.onCloseModal();
          const btnClose = this.btn.nativeElement.querySelector('#BtnCloseModal');
          if (btnClose) {
            btnClose.click(); 
          }

          this.toastService.success('Selfi de identidad cargada correctamente!');

        },
        error: (err: HttpErrorResponse) => {
          this.frmStories.reset();
          this.fileToUpload = undefined;
          this.isPosting = false;
          this.onCloseModal();
          const btnClose = this.btn.nativeElement.querySelector('#BtnCloseModal');
          if (btnClose) {
            btnClose.click(); 
          }

          if (err.status === 401) {
            this.toastService.error('Tiempo de sesión expirado, por favor ingrese nuevamente!');
          } else
            this.toastService.error('Error en la carga de la selfie de identidad!');

        }
      });
    }

  }
}
