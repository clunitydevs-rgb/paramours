import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioI, WelcomeMail } from '../models/models.interface';
import { ApiServices } from '../api/api.service';
import { MethodService } from '../method/method.service';
import { ResponseI, ResponseMsg } from '../models/response.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../service/toast.service';
import { AnalyticsService } from '../service/analytics.service';

@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './account.html',
  styleUrl: './account.css'
})
export class Account implements OnInit {

  WelcomeMail: WelcomeMail = {
    name: '',
    email: '',
    type: ''
  }

  Registro: UsuarioI = {
    sUid: 0,
    sNomUsuario: '',
    sPwd: '',
    fchNacimiento: '',
    sEmail: '',
    sCelular: '',
    sEdad: 0,
    sTipo: '',
    sGenero: ''
  }
  private typeUser: string = "";
  public hddUserClient: boolean = true;
  public bMsgEmailValid = true;
  public bMsgPassValid = true;
  public bMsgUserNameValid = true;
  public bMsgEAgeEnable = true;
  public sTitle: string = "";

  constructor(
    private api: ApiServices,
    private router: Router,
    private methodservice: MethodService,
    private activateroute: ActivatedRoute,
    private toastService: ToastService,
    private analyticsService: AnalyticsService
  ) { }

  ngOnInit() {
    this.activateroute.params.subscribe(params => {
      this.typeUser = params['typeuser'];
      if (this.typeUser == "client") {
        this.sTitle = "Publicate";
        this.hddUserClient = false;
        this.frmAccount.controls.servicio.setValidators(Validators.required);
      }
      else {
        this.sTitle = "Registrate";
        this.hddUserClient = true;
        this.frmAccount.controls.servicio.clearValidators();
      }
      this.frmAccount.controls.servicio.updateValueAndValidity();
      this.setForms();
    });

  }


  get dia() {
    return this.frmAccount.get('dia') as FormControl;
  }

  get ano() {
    return this.frmAccount.get('ano') as FormControl;
  }

  frmAccount = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    dia: new FormControl('', [Validators.required, Validators.pattern("^[0-9]*$")]),
    mes: new FormControl('', Validators.required),
    ano: new FormControl('', [Validators.required, Validators.pattern("^[0-9]*$")]),
    password: new FormControl('', Validators.required),
    username: new FormControl('', Validators.required),
    celular: new FormControl('', (!this.hddUserClient) ? Validators.required : null),
    servicio: new FormControl('', (!this.hddUserClient) ? Validators.required : null),
  });

  setForms() {
    this.frmAccount.controls.email.setValue("");
    this.frmAccount.controls.dia.setValue("");
    this.frmAccount.controls.mes.setValue("");
    this.frmAccount.controls.ano.setValue("");
    this.frmAccount.controls.password.setValue("");
    this.frmAccount.controls.username.setValue("");
    this.frmAccount.controls.celular.setValue("");
    this.frmAccount.controls.servicio.setValue("");
  }

  goBtnAceptar() {
    this.bMsgPassValid = true;
    this.bMsgEAgeEnable = true;
    this.bMsgEmailValid = true;
    this.bMsgUserNameValid = true;

    let bEndPointExec = true;
    let sPass: string = this.frmAccount.get('password')?.value!;

    if (sPass.length < 4) {
      this.bMsgPassValid = false;
      bEndPointExec = false;
    }

    const dCurrentDate = +new Date();
    const dayDefinition = 1000 * 60 * 60 * 24 // Este número es: Milisegundos * segundos * minutos * horas
    let sDay: string = this.frmAccount.get('dia')?.value!;
    if (sDay.length == 1) sDay = '0' + sDay;
    let sMonth: string = this.frmAccount.get('mes')?.value!;
    let sYear: string = this.frmAccount.get('ano')?.value!;
    const dFch = +new Date(sYear + '-' + sMonth + '-' + sDay);
    const dfchSrv = sDay + "/" + sMonth + "/" + sYear;
    const daysDiff: any = Math.ceil((Math.abs(dCurrentDate - dFch)) / dayDefinition);
    const years = Math.floor(daysDiff / 365.25);

    if (years < 18) {
      this.bMsgEAgeEnable = false;
      bEndPointExec = false;
    }

    this.Registro.sNomUsuario = this.frmAccount.get('username')?.value!;
    this.Registro.sEmail = this.frmAccount.get('email')?.value!;
    this.Registro.fchNacimiento = dfchSrv;
    this.Registro.sCelular = this.frmAccount.get('celular')?.value!;
    this.Registro.sPwd = sPass;
    this.Registro.sEdad = years;
    this.Registro.sTipo = (this.typeUser == 'client' ? "2" : "3");
    this.Registro.sGenero = this.typeUser == 'client' ? this.frmAccount.get('servicio')?.value! : '';

    if (bEndPointExec) {
      this.api.postRegistro(this.Registro).subscribe({
        next: (data: ResponseI) => {

          if (data.ncoderror == "1") {
            this.bMsgEmailValid = false;
          } else if (data.ncoderror == "2") {
            this.bMsgUserNameValid = false;
          } else {
            this.methodservice.setItemLocalStorage("cl.paramours.token", data.token);
            this.methodservice.setItemLocalStorage("cl.paramours.sUid", data.sUid);
            this.methodservice.setItemLocalStorage("cl.paramours.refreshToken", data.refreshToken);
            this.methodservice.setItemLocalStorage("cl.paramours.typeuser", data.typeU);
            this.methodservice.setItemLocalStorage("cl.paramours.sFotoPerfl", (data.sFotoPerfl != null) ? data.sFotoPerfl : '');

            const ahora = Date.now(); // milisegundos
            this.methodservice.setItemLocalStorage('fechaIngreso', ahora.toString());

            this.WelcomeMail.name = this.Registro.sNomUsuario;
            this.WelcomeMail.email = this.Registro.sEmail;
            this.WelcomeMail.type = this.Registro.sTipo;

            this.api.WelcomeContact(this.WelcomeMail).subscribe({
              next: (data: ResponseMsg) => {
              },
              error: err => {
              }
            });

            //this.methodservice.tShowMenu.emit(true);
            this.methodservice.isLogin();
            this.toastService.success('Cuenta registrada exitosamente!');
            if (this.Registro.sTipo == "2") {
              this.analyticsService.trackEvent('account', {
                nueva_cuenta_anunciante: data.sUid
              });
              this.router.navigate(['/settingaccount']);
            } else {
              this.analyticsService.trackEvent('account', {
                nueva_cuenta_visitante: data.sUid
              });
              this.router.navigate(['/home']);
            }

          }
        },
        error: err => {
          this.toastService.error('Problemas con los servicios de para registrar!');
        }
      });
    }


  }
}
