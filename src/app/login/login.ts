import { Component, ElementRef } from '@angular/core';
import { ClaveMail, LoginI } from '../models/models.interface';
import { ApiServices } from '../api/api.service';
import { MethodService } from '../method/method.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ResponseI, ResponseMsg } from '../models/response.interface';
import { CommonModule } from '@angular/common';
import { ToastService } from '../service/toast.service';
import { AnalyticsService } from '../service/analytics.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  Login: LoginI = {
    sEmail: '',
    sPwd: ''
  }

  ClaveMail: ClaveMail = {
    email: ''
  }

  public bMsgEmailValid = true;
  public bMsgPassValid = true;
  public bMsgErrorLogin = true;

  constructor(
    private api: ApiServices,
    private btn: ElementRef,
    private router: Router,
    private methodservice: MethodService,
    private toastService: ToastService,
    private analyticsService: AnalyticsService
  ) { }

  frmAccount = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required)
  });

  frmClave = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  goBtnAceptar() {
    this.bMsgEmailValid = true;
    this.bMsgPassValid = true;
    this.bMsgErrorLogin = true;

    let bEndPointExec = true;
    let sPass: string = this.frmAccount.get('password')?.value!;

    if (sPass.length < 4) {
      this.bMsgPassValid = false;
      bEndPointExec = false;
    }

    this.Login.sEmail = this.frmAccount.get('email')?.value!;
    this.Login.sPwd = sPass;

    if (bEndPointExec) {
      this.api.postLogin(this.Login).subscribe({
        next: (data: ResponseI) => {

          if (data.ncoderror == "1") {
            this.bMsgEmailValid = false;
          } else if (data.ncoderror == "2") {
            this.bMsgErrorLogin = false;
          } else {
            this.methodservice.setItemLocalStorage("cl.paramours.token", data.token);
            this.methodservice.setItemLocalStorage("cl.paramours.sUid", data.sUid);
            this.methodservice.setItemLocalStorage("cl.paramours.refreshToken", data.refreshToken);
            this.methodservice.setItemLocalStorage("cl.paramours.typeuser", data.typeU);
            this.methodservice.setItemLocalStorage("cl.paramours.sFotoPerfl", (data.sFotoPerfl != null) ? data.sFotoPerfl : '');

            const ahora = Date.now(); // milisegundos
            this.methodservice.setItemLocalStorage('fechaIngreso', ahora.toString());

            //this.methodservice.tShowMenu.emit(true);
            this.methodservice.isLogin();

            this.analyticsService.trackEvent('login', {
              login: data.sUid
            });

            if (data.typeU == "2")
              this.router.navigate(['/profile/' + + data.sUid + "/" + data.sLug]);
            else
              this.router.navigate(['/home']);

          }
        },
        error: err => {
          this.toastService.error('Problemas con los servicios de autenticacion!');
          //console.error(err);
        }
        //complete: () =>{
        //console.log("termino");
        //}
      });
    }
  }

  onCloseModal() {
    this.frmClave.controls.email.setValue('');
  }

  goSendMail() {

    if (this.frmClave.valid) {
      this.ClaveMail.email = this.frmClave.value.email || '';

      this.api.RecoveryPassword(this.ClaveMail).subscribe({
        next: (data: ResponseMsg) => {
          if (data.ncoderror == "0") {
            this.toastService.success('Correo de solicitud de contraseña enviada exitosamente!');
            this.onCloseModal();

            const btnClose = this.btn.nativeElement.querySelector('#btnCloseModal');
            if (btnClose) {
              btnClose.click();
            }
          }
          else
            this.toastService.error('No se pudo enviar el correo de solicitud de contraseña, por favor intente más tarde!');
        },
        error: err => {
          this.toastService.error('No se pudo enviar el correo de solicitud de contraseña, por favor intente más tarde!');
        }
      });

    }

  }
}
