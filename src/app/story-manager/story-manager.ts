import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IDHISTORIA, ImageProfile, Story, UidUser } from '../models/models.interface';
import { ApiServices } from '../api/api.service';
import { ResponseMediaFiles, rStory } from '../models/response.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../service/toast.service';
import { AnalyticsService } from '../service/analytics.service';
import { MethodService } from '../method/method.service';

@Component({
  selector: 'app-story-manager',
  imports: [CommonModule],
  templateUrl: './story-manager.html',
  styleUrl: './story-manager.css'
})
export class StoryManager implements OnInit {

  @Output() storiesChanged = new EventEmitter<void>();

  stories: Story[] = [];
  uploading: boolean = false;

  constructor(
    private api: ApiServices,
    private toastService: ToastService,
    private analyticsService: AnalyticsService,
    private methodservice: MethodService

  ) { }

  ngOnInit() {
    this.loadStories();
  }

  loadStories() {

    this.api.GetStories().subscribe({
      next: (data: rStory) => {
        this.stories = [];
        for (let items of data.oStories) {
          this.stories.push(items);
        }
      },
      error: err => {
        this.toastService.error('Error en cargar las imagenes!');
      }
    });

  }

  clearStories() {
    const activeStories = document.getElementById('activeStories') as HTMLElement;
    if (activeStories) {
      activeStories.innerHTML = "";
    }

    const inactiveStories = document.getElementById('inactiveStories') as HTMLElement;
    if (inactiveStories) {
      inactiveStories.innerHTML = "";
    }
  }

  get activeStories() {
    return this.stories.filter(s => s.isActive);
  }

  get inactiveStories() {
    return this.stories.filter(s => !s.isActive);
  }

  toggleStatus(story: Story) {
    story.isActive = !story.isActive;

    const oHistoria: IDHISTORIA = {
      nIDHISTORIA: story.id,
      bESTADO: story.isActive
    }

    this.api.ActiveStories(oHistoria).subscribe({
      next: data => {
        this.uploading = true;
        this.loadStories();
        this.storiesChanged.emit();

      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401)
          this.toastService.error('Tiempo de sesión expirado, por favor ingrese nuevamente!');
        else
          this.toastService.error('Problema con el servicio para actualizar la foto del perfil!');
      }
    });

    setTimeout(() => this.uploading = false, 1500);

  }



  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files: FileList | null = target.files;

    if (files!.length > 0 && files != null) {
      Array.prototype.forEach.call(files, (file: File) => {

        const imageProfile: ImageProfile = {
          photoprofile: file
        }

        const frmData = new FormData();
        frmData.append('Achivos', file, file.name);

        //frmData.append('Achivos', imageProfile.photoprofile);
        this.api.addStories(frmData).subscribe({
          next: data => {
            this.uploading = true;

            //this.clearStories();

            this.loadStories();
            this.storiesChanged.emit();

            this.analyticsService.trackEvent('story_manager', {
              addStories: this.methodservice.getItemLocalStorage("cl.paramours.sUid")
            });
          },
          error: (err: HttpErrorResponse) => {
            if (err.status === 401) {
              this.toastService.error('Tiempo de sesión expirado, por favor ingrese nuevamente!');
            }
            else if (err.status === 400) {
              this.toastService.error('Solicitud inválida al subir las imágenes!');
              //this.error_srv = err.status.toString() + ' - ' + err.statusText + ' - ' + err.error?.message;
            }
            else if (err.status === 0) {
              this.toastService.error('No se pudo subir el video. Revisa tamaño, conexión o formato del archivo.');
            }
            else {
              this.toastService.error('Problemas con los servicios para subir las imagenes!');
              //this.error_srv = err.status.toString() + ' - ' + err.statusText + ' - ' + err.error?.message;
            }
          }
        });

        setTimeout(() => this.uploading = false, 1500);

      });
    }

  }

  uploadStory(file: File) {
    this.uploading = true;

    // this.api.uploadStory(file).subscribe({
    //   next: () => this.uploading = false,
    //   error: () => this.uploading = false
    // });

    setTimeout(() => this.uploading = false, 1500);
  }

}
