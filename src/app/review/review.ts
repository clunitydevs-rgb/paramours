import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { PublicationForm, Reviews, UidUser } from '../models/models.interface';
import { ApiServices } from '../api/api.service';
import { ToastService } from '../service/toast.service';
import { ResponseMsg, rReview, rValLastReview, rValoracion } from '../models/response.interface';
import { CommonModule } from '@angular/common';
import { MethodService } from '../method/method.service';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AnalyticsService } from '../service/analytics.service';

@Component({
  selector: 'app-review',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './review.html',
  styleUrl: './review.css'
})
export class Review implements OnChanges {

  @Input() iUser: number | null = null;
  @Input() bNoOwner: boolean | null = true;
  @Input() abrir = false;
  @Output() cerrar = new EventEmitter<void>();

  @ViewChild('reviews') reviews!: ElementRef<HTMLDivElement>;
  //@ViewChild('txt_review', { static: true }) txt_review!: ElementRef<HTMLInputElement>;

  //sUrlRps: string = "https://demofilesblobazure.blob.core.windows.net/rpsfilescontainer/";
  sUrlRps: string = "https://paramoursfilesblobazure.blob.core.windows.net/rpsfilescontainer/";
  proFileImg: string = "https://paramoursfilesblobazure.blob.core.windows.net/rpsfilescontainer/avatar_visitante.png";
  bShowBlockReview: boolean = true;
  ArrReviews: Array<any> = [];
  pageIndex: number = 0;
  totalPages: number = 0
  PostExecute: boolean = true;
  lblTitleValorations: string = "Haz una calificación";
  iUltNota: number = 0;
  txt_review: string = '';

  rating: number = 0;     // valor actual (ej: 3.5)
  maxStars: number = 5;   // total de estrellas
  readOnly: boolean = false;

  stars: number[] = [];
  hoverRating: number = 0;

  uIdUser: UidUser = {
    sUid: 0
  }

  publication: PublicationForm = {
    sUid: 0,
    pageIndex: 1,
    pageSize: 5
  }

  public oReviews: Reviews = {
    idReview: 0,
    comentario: '',
    fecha: '',
    nota: 0,
    idUsuario: 0,
    idUsuarioReview: 0,
    nombreUsuarioReview: '',
    fotoPerfilReview: '',
    oldnota: 0
  }

  frmReview = new FormGroup({
    txtreview: new FormControl('', null),
  });
  renderer: any;

  constructor(
    private api: ApiServices,
    private methodservice: MethodService,
    private toastService: ToastService,
    private analyticsService: AnalyticsService
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['abrir']?.currentValue === true) {
      this.pageIndex = 0;
      this.totalPages = 0
      this.ArrReviews = [];
      this.setRating(0);

      this.LoadStar();
      this.LoadReviews();
    }

  }

  esDiv(el: any): el is HTMLDivElement {
    return el instanceof HTMLDivElement;
  }

  LoadStar() {
    if (((this.methodservice.getItemLocalStorage("cl.paramours.sUid") != null) && (this.methodservice.getItemLocalStorage("cl.paramours.sUid") != '')) && (this.methodservice.getItemLocalStorage('cl.paramours.sUid') != this.iUser?.toString())) {
      this.stars = Array(this.maxStars).fill(0).map((_, i) => i + 1);

      this.uIdUser.sUid = this.methodservice.getItemLocalStorage("cl.paramours.sUid") as unknown as number;

      this.api.GetLastValReviewUser(this.uIdUser).subscribe({
        next: (data: rValLastReview) => {
          if (data.oValReview != null) {
            if (data.oValReview.nota != null) {
              this.lblTitleValorations = "Tu última calificación, puedes cambiarla si lo deseas";
              this.setRating(data.oValReview.nota);
              this.iUltNota = data.oValReview.nota;
            }

          }
        },
        error: (err) => {
          this.toastService.error('Error en cargar la valorizacion!');

        }
      });


      this.bShowBlockReview = false;
    }
  }

  LoadReviews() {

    if (this.iUser != null) {
      this.publication.sUid = this.iUser;
      this.publication.pageIndex = this.pageIndex + 1;
      this.publication.pageSize = 10;

      this.api.GetReviewByIduser(this.publication).subscribe({
        next: (data: rReview) => {
          this.pageIndex++;
          let oData = Object.values(data.oReview);
          this.totalPages = data.totalPages;

          if (this.ArrReviews.length == 0)
            this.ArrReviews = [];

          for (let items of oData) {
            this.ArrReviews.push(items);
          }

          if (this.pageIndex < this.totalPages) {
            this.PostExecute = true;
          }

          this.analyticsService.trackEvent('review', {
            LoadReviews: this.iUser
          });

        },
        error: (err) => {
          this.toastService.error('Error en cargar las reviews!');

        }
      });
    }
  }

  cerrarModal() {
    this.cerrar.emit();
  }

  setRating(star: number) {
    if (this.readOnly) return;
    this.rating = star;
  }

  onMouseEnter(star: number) {
    if (this.readOnly) return;
    this.hoverRating = star;
  }

  onMouseLeave() {
    if (this.readOnly) return;
    this.hoverRating = 0;
  }

  isFilled(star: number): boolean {
    return this.hoverRating
      ? star <= this.hoverRating
      : star <= this.rating;
  }

  onScroll(): void {
    const el = this.reviews.nativeElement;

    const scrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 5) {

      if (this.PostExecute) {
        this.PostExecute = false;
        this.LoadReviews();
      }
    }

  }

  onPost() {
    if (this.rating <= 0) {
      this.toastService.error('Selecciona una calificación antes de enviar.');
      return;
    }

    this.oReviews.idUsuario = this.iUser ? this.iUser : 0;
    //this.oReviews.idUsuarioReview = this.uIdUser.sUid ? this.uIdUser.sUid : 0;
    this.oReviews.nota = this.rating;
    this.oReviews.comentario = this.frmReview.get('txtreview')?.value!;
    this.oReviews.oldnota = this.iUltNota;

    this.api.AddReview(this.oReviews).subscribe({
      next: (data: ResponseMsg) => {
        this.pageIndex = 0;
        this.totalPages = 0;
        this.ArrReviews = [];

        this.frmReview.get('txtreview')?.setValue('');
        this.iUltNota = this.rating;
        this.lblTitleValorations = "Tu última calificación, puedes cambiarla si lo deseas";
        this.LoadReviews();
        this.toastService.success(data.message);

        this.analyticsService.trackEvent('review', {
          AddReview: this.iUser
        });
      },
      error: (err) => {
        this.toastService.error('Error al enviar la reseña!');
      }
    });

  }
}
