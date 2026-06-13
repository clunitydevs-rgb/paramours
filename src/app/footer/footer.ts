import { CommonModule } from '@angular/common';
import { Component, ElementRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactMail } from '../models/models.interface';
import { ApiServices } from '../api/api.service';
import { ToastService } from '../service/toast.service';
import { ResponseMsg } from '../models/response.interface';
import { AnalyticsService } from '../service/analytics.service';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer {
  anioActual: number = new Date().getFullYear();

  ContactMail: ContactMail = {
    email: '',
    description: ''
  }

  constructor(
    private api: ApiServices,
    private btn: ElementRef,
    private toastService: ToastService,
    private analyticsService : AnalyticsService
  ) { }

  frmContact = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    descripcion: new FormControl('', Validators.required)
  });

  onCloseModal() {
    this.frmContact.controls.email.setValue('');
    this.frmContact.controls.descripcion.setValue('');
  }

  goSendMail() {

    if (this.frmContact.valid) {
      this.ContactMail.email = this.frmContact.value.email || '';
      this.ContactMail.description = this.frmContact.value.descripcion || '';

      this.api.ClietContact(this.ContactMail).subscribe({
        next: (data: ResponseMsg) => {
          if (data.ncoderror == "0") {
            this.toastService.success('Correo de solicitud de contacto enviado exitosamente!');
            this.onCloseModal();

            this.analyticsService.trackEvent('contactanos', {
              email_contactanos: this.frmContact.value.email
            });

            const btnClose = this.btn.nativeElement.querySelector('#btnCloseModal');
            if (btnClose) {
              btnClose.click();
            }
          }
          else
            this.toastService.error('No se pudo enviar el correo de solicitud de contacto, por favor intente más tarde!');
        },
        error: err => {
          this.toastService.error('No se pudo enviar el correo de solicitud de contacto, por favor intente más tarde!');
        }
      });

    }

  }

}
