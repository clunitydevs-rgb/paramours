import { Component } from '@angular/core';
import { ActiveProfile, Cliente, ImageProfile, UidUser } from '../models/models.interface';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiServices } from '../api/api.service';
import { MethodService } from '../method/method.service';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GalleryLightbox } from '../gallery-lightbox/gallery-lightbox';
import { ResponseClient, ResponseMediaFiles } from '../models/response.interface';
import { ToastService } from '../service/toast.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Identitycheck } from "../identitycheck/identitycheck";
import { AnalyticsService } from '../service/analytics.service';

interface Item {
  iId: number,
  iUid: number,
  sNomMediaFile: string,
  sMediaFile: string,
  sMediaType: string
}

interface Files {
  mFile: File
}

@Component({
  selector: 'app-settingaccount',
  imports: [ReactiveFormsModule, CommonModule, GalleryLightbox, Identitycheck],
  templateUrl: './settingaccount.html',
  styleUrl: './settingaccount.css'
})
export class Settingaccount {

  //sUrlRps: string = "https://demofilesblobazure.blob.core.windows.net/rpsfilescontainer/";
  sUrlRps: string = "https://paramoursfilesblobazure.blob.core.windows.net/rpsfilescontainer/";
  public dFechaNac: any;
  public proFileImg: string | null = null;
  public dataOutput: string = '';
  public bShowComuna = true;
  public bShowMetro = true;
  public oCiudades:any;
  public oComunas: Array<any> = [];
  public oNacionalidades: any;
  public oGeneros: any;
  public oMetros: Array<any> = [];
  public oColorOjos: any;
  public oColorCabello: any;
  public oBiotipo: any;
  public isOwner: boolean = false;
  public isProfileActive: boolean = false;
  public isProfileBlocked: boolean = false;
  public bHiddenProfileValided: boolean = true;

  ActiveProfileFrm: ActiveProfile = {
    Uid: '',
    estado: ''
  }

  uIdUser: UidUser = {
    sUid: 0
  }

  items: any = {
    idComuna: '',
    idMetro: '',
    NombreMetro: ''
  }

  public oCliente: Cliente = {
    iD_USUARIO: 0,
    nombrE_USUARIO: '',
    fechA_NACIMIENTO: '',
    edad: 0,
    correo: '',
    celular: '',
    genero: '',
    nacionalidad: 0,
    medidas: '',
    altura: '',
    peso: 0,
    horariO_ATENCION: 0,
    horariO_PART_TIME: '',
    ciudad: 0,
    comuna: 0,
    metro: 0,
    valor: 0,
    colorojos: 0,
    colorcabello: 0,
    biotipo: 0,
    descripcion: '',
    estado: '',
    tipo: '',
    fechA_CREACION: '',
    fechA_ACTIVACION: '',
    fotO_PERFIL: ''
  }

  constructor(
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiServices,
    private methodservice: MethodService,
    private toastService: ToastService,
    private analyticsService: AnalyticsService
  ) { }

  frmAccount = new FormGroup({
    email: new FormControl(''),
    celular: new FormControl(''),
    edad: new FormControl(''),
    nacionalidad: new FormControl(''),
    genero: new FormControl(''),
    medidas: new FormControl(''),
    altura: new FormControl(''),
    peso: new FormControl(''),
    horario: new FormControl(''),
    horario_parttime: new FormControl(''),
    ciudad: new FormControl(''),
    ubicacion: new FormControl(''),
    metro: new FormControl(''),
    valor: new FormControl(''),
    colordeojos: new FormControl(''),
    colorcabello: new FormControl(''),
    biotipo: new FormControl(''),
    descripcion: new FormControl(),
    fotoperfil: new FormControl()

  });

  ngOnInit(): void {
    this.LoadProfile();

    this.methodservice.tInProcess.subscribe((data: string) => {
      if (data === 'P') {
        this.bHiddenProfileValided = true;
        this.isProfileActive = false;
        this.oCliente.estado = 'P';
      }
    });

  }

  toggleProfileStatus() {
    if (!this.isProfileActive) {
      this.ActiveProfileFrm.estado = 'V';
    }
    else if (this.isProfileActive) {
      this.ActiveProfileFrm.estado = 'N';
    }

    this.api.ActiveProfile(this.ActiveProfileFrm).subscribe({
      next: (data: ResponseClient) => {
        if (!this.isProfileActive) {
          this.isProfileActive = true;
        }
        else if (this.isProfileActive) {
          this.isProfileActive = false;
        }
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401)
          this.toastService.error('Tiempo de sesión expirado, por favor ingrese nuevamente!');
        else
          this.toastService.error('Error al cambiar el estado del perfil!');
      }
    });
  }

  LoadProfile() {
    var sUid = this.methodservice.getItemLocalStorage("cl.paramours.sUid");

    this.api.getCiudades().subscribe(data => {
      this.oCiudades = data;
    });

    this.api.getComunas().subscribe(data => {
      this.oComunas = data;
    });

    this.api.getNaciones().subscribe(data => {
      this.oNacionalidades = data;
    });

    this.api.getGeneros().subscribe(data => {
      this.oGeneros = data;
    });

    this.api.getColorOjos().subscribe(data => {
      this.oColorOjos = data;
    });

    this.api.getColorCabello().subscribe(data => {
      this.oColorCabello = data;
    });

    this.api.getBiotipo().subscribe(data => {
      this.oBiotipo = data;
    });

    this.api.getClientByToken().subscribe({
      next: (data: ResponseClient) => {
        if ((data.ncoderror == '0') && (sUid === data.oClient.iD_USUARIO.toString())) {
          this.oCliente = data.oClient;
          this.frmAccount.controls.email.setValue(this.oCliente.correo);
          this.frmAccount.controls.celular.setValue(this.oCliente.celular);

          if (this.oCliente.genero != null)
            this.frmAccount.controls.genero.setValue(this.oCliente.genero.toString());

          this.frmAccount.controls.edad.setValue(this.oCliente.edad.toString());

          if (this.oCliente.nacionalidad != null)
            this.frmAccount.controls.nacionalidad.setValue(this.oCliente.nacionalidad.toString());

          if (this.oCliente.horariO_ATENCION != null)
            this.frmAccount.controls.horario.setValue(this.oCliente.horariO_ATENCION.toString());

          if (this.oCliente.ciudad != null){
            this.frmAccount.controls.ciudad.setValue(this.oCliente.ciudad.toString());
            if (this.oCliente.ciudad.toString() != '') {
              this.getComunas(this.oCliente.ciudad.toString(), this.oCliente.comuna?.toString());
            }
          }

          if (this.oCliente.metro != null)
            this.frmAccount.controls.metro.setValue(this.oCliente.metro.toString());

          this.frmAccount.controls.medidas.setValue(this.oCliente.medidas);
          this.frmAccount.controls.altura.setValue(this.oCliente.altura);

          if (this.oCliente.peso != null)
            this.frmAccount.controls.peso.setValue(this.oCliente.peso.toString());

          if (this.oCliente.valor != null) {
            const valor = Number(this.oCliente.valor.toString().replace(/\D/g, ''));
            this.frmAccount.controls.valor.setValue(valor.toLocaleString('es-CL'));
          }


          if (this.oCliente.colorojos != null)
            this.frmAccount.controls.colordeojos.setValue(this.oCliente.colorojos.toString());

          if (this.oCliente.colorcabello != null)
            this.frmAccount.controls.colorcabello.setValue(this.oCliente.colorcabello.toString());

          if (this.oCliente.biotipo != null)
            this.frmAccount.controls.biotipo.setValue(this.oCliente.biotipo.toString());

          this.frmAccount.controls.descripcion.setValue(this.oCliente.descripcion);
          this.dFechaNac = new Date(this.oCliente.fechA_NACIMIENTO).getFullYear().toString()

          if ((this.oCliente.fotO_PERFIL != null) && (this.oCliente.fotO_PERFIL != ''))
            this.proFileImg = this.sUrlRps + this.oCliente.fotO_PERFIL;
          else {
            if (this.oCliente.tipo === '2')
              this.proFileImg = this.sUrlRps + 'avatar_anunciante.png';
            else
              this.proFileImg = this.sUrlRps + 'avatar_visitante.png';
          }

          this.uIdUser.sUid = this.oCliente.iD_USUARIO;

          switch (this.oCliente.estado) {
            case 'V':
              this.bHiddenProfileValided = false;
              this.isProfileActive = true;
              break;
            case 'N':
              this.bHiddenProfileValided = false;
              this.isProfileActive = false;
              break;
            case 'P':
              this.bHiddenProfileValided = true;
              this.isProfileActive = false;
              break;
          }

          this.getMediaFiles();

          this.analyticsService.trackEvent('settingaccount', {
            view_profile: this.oCliente.iD_USUARIO
          });
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.toastService.error('Tiempo de sesión expirado, por favor ingrese nuevamente!');
          this.methodservice.delUserLocalStorage();
          //localStorage.clear();
        }
        else
          this.toastService.error('Problemas con los servicios para cargar los datos del perfil!');
        //console.error(err);
      }
    });
  }
  getMediaFiles() {
    this.api.getMediaFiles(this.uIdUser).subscribe({
      next: (data: ResponseMediaFiles) => {
        //console.log(data);
        this.methodservice.tMediaFiles.emit(data.oMediaFiles);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401)
          this.toastService.error('Tiempo de sesión expirado, por favor ingrese nuevamente!');
        else
          this.toastService.error('Problemas con los servicios para cargar las imagenes!');
      }
    });
  }

  onCiudadSelect(event: Event): void {
    const nValue = (event.target as HTMLInputElement).value;
    this.frmAccount.controls.ubicacion.setValue('');
    this.frmAccount.controls.metro.setValue('');
    this.bShowComuna = true;
    this.bShowMetro = true;
    this.oComunas = [];
    this.oMetros = [];

    this.getComunas(nValue);

  }

  getComunas(dVal: string, selectedComuna: string = '') {
    if (dVal === '') {
      this.bShowComuna = true;
      this.bShowMetro = true;
      return;
    }

    this.api.getComunas().subscribe(data => {
      this.oComunas = data.filter((items: any) => items["id_ciudad"] == dVal);
      this.bShowComuna = this.oComunas.length === 0;
      this.bShowMetro = true;

      if (this.bShowComuna) {
        this.frmAccount.controls.ubicacion.setValue('');
        this.frmAccount.controls.metro.setValue('');
        return;
      }

      if (selectedComuna !== '' && this.oComunas.some((items: any) => items["id"] == selectedComuna)) {
        this.frmAccount.controls.ubicacion.setValue(selectedComuna);
        this.getMetros(selectedComuna);
      }

    })
  }

  onComunaSelect(event: Event): void {
    const nValue = (event.target as HTMLInputElement).value;
    this.frmAccount.controls.metro.setValue('');
    this.bShowMetro = true;
    this.oMetros = [];

    this.getMetros(nValue);

  }

  getMetros(dVal: string) {
    if (dVal === '') {
      this.bShowMetro = true;
      return;
    }

    this.api.getMetros().subscribe(data => {
      this.oMetros = data.filter((items: any) =>
        items["idComuna"] == dVal && items["NombreMetro"] !== 'Sin estaciones'
      );
      this.bShowMetro = this.oMetros.length === 0;

      if (this.bShowMetro) {
        this.frmAccount.controls.metro.setValue('');
      }

    })
  }

  goBtnAceptar() {
    let sEmail = this.frmAccount.get('email')?.value!;

    this.oCliente.correo = sEmail;
    this.oCliente.celular = this.frmAccount.get('celular')?.value!;
    this.oCliente.genero = this.frmAccount.get('genero')?.value!;
    this.oCliente.edad = parseInt(this.frmAccount.get('edad')?.value!);
    this.oCliente.nacionalidad = parseInt(this.frmAccount.get('nacionalidad')?.value!);
    this.oCliente.medidas = this.frmAccount.get('medidas')?.value!;
    this.oCliente.altura = this.frmAccount.get('altura')?.value!;
    if (this.frmAccount.get('peso')?.value != '')
      this.oCliente.peso = parseInt(this.frmAccount.get('peso')?.value!);
    this.oCliente.horariO_ATENCION = parseInt(this.frmAccount.get('horario')?.value!);
    this.oCliente.horariO_PART_TIME = this.frmAccount.get('horario_parttime')?.value!;
    this.oCliente.ciudad = this.parseFormNumber('ciudad');
    this.oCliente.comuna = this.bShowComuna ? 0 : this.parseFormNumber('ubicacion');
    this.oCliente.metro = this.bShowMetro ? 0 : this.parseFormNumber('metro');
    if (this.frmAccount.get('valor')?.value! != null && this.frmAccount.get('valor')?.value! != '') {
      const valor = this.frmAccount.get('valor')?.value!;
      this.oCliente.valor = parseInt(valor.replace(/[.,]/g, ''));
    }
    this.oCliente.colorojos = parseInt(this.frmAccount.get('colordeojos')?.value!);
    this.oCliente.colorcabello = parseInt(this.frmAccount.get('colorcabello')?.value!);
    this.oCliente.biotipo = parseInt(this.frmAccount.get('biotipo')?.value!);
    this.oCliente.descripcion = this.frmAccount.get('descripcion')?.value!;

    this.api.updateClient(this.oCliente).subscribe({
      next: data => {
        this.toastService.success('Datos del perfil actualizados correctamente!');

        this.analyticsService.trackEvent('settingaccount', {
          edit_profile: this.oCliente.iD_USUARIO
        });

      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401)
          this.toastService.error('Tiempo de sesión expirado, por favor ingrese nuevamente!');
        else
          this.toastService.error('Problemas con los servicios para actualizar los datos del perfil!');
      }
    });
  }

  private parseFormNumber(controlName: string): number {
    const value = this.frmAccount.get(controlName)?.value;
    const parsedValue = parseInt(value ?? '');
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
  }

  archivos: any = [];
  formData = new FormData();
  imagePreview: string = "";
  videoPreview: string = "";
  typePreview: string = "";

  private ConstruyeFrmData(fotoperfil: ImageProfile): FormData {
    const imageProfile = new FormData();

    imageProfile.append('foto', fotoperfil.photoprofile);

    return imageProfile;
  }

  CargarImgFotoPerfil(event: Event) {

    const target = event.target as HTMLInputElement;
    const files: FileList | null = target.files;
    if (files!.length > 0 && files != null) {
      Array.prototype.forEach.call(files, (file: File) => {

        const imageProfile: ImageProfile = {
          photoprofile: file
        }

        const frmData = new FormData();
        frmData.append('foto', imageProfile.photoprofile);
        this.api.updateLoadPhotoProfile(frmData).subscribe({
          next: data => {
            this.oCliente = data.oClient;
            this.proFileImg = this.sUrlRps + this.oCliente.fotO_PERFIL;
            this.methodservice.setItemLocalStorage("cl.paramours.sFotoPerfl", this.oCliente.fotO_PERFIL);

            this.analyticsService.trackEvent('settingaccount', {
              updateLoadPhotoProfile: this.oCliente.iD_USUARIO
            });
          },
          error: (err: HttpErrorResponse) => {
            if (err.status === 401)
              this.toastService.error('Tiempo de sesión expirado, por favor ingrese nuevamente!');
            else
              this.toastService.error('Problema con el servicio para actualizar la foto del perfil!');
          }
        });

      });
    }
  }

  CapturarImagenes(event: Event) {
    const target = event.target as HTMLInputElement;
    const files: FileList | null = target.files;

    if (files!.length > 0 && files != null) {
      Array.prototype.forEach.call(files, (file: File) => {
        //console.log(file.type);

        const mediaFiles: Files = {
          mFile: file,
        }

        const frmData = new FormData();
        frmData.append('Achivos', mediaFiles.mFile);

        this.api.updateLoadMediaFiles(frmData).subscribe({
          next: data => {
            //console.log('updateLoadMediaFiles : ' + data);
            this.getMediaFiles();

            this.analyticsService.trackEvent('settingaccount', {
              updateLoadMediaFiles: this.oCliente.iD_USUARIO
            });
          },
          error: (err: HttpErrorResponse) => {
            if (err.status === 401)
              this.toastService.error('Tiempo de sesión expirado, por favor ingrese nuevamente!');
            else
              this.toastService.error('Problema con el servicio para actualizar las imagenes!');
          }
        });
      })
      //this.methodservice.tMediaFiles.emit(this.MediaFiles);
    }
  }

  toDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject('Error: no se pudo convertir el archivo a Base64');
        }
      };

      reader.onerror = (error) => {
        reject('Error leyendo el archivo: ');
      };

      reader.readAsDataURL(file);
    });
  }

  montoFormateado: string = '';
  formatearMonto(event: any) {
    let value = event.target.value.replace(/\D/g, '');

    if (!value) {
      this.montoFormateado = '';
      return;
    }

    const numericValue = parseInt(value, 10);
    this.montoFormateado = numericValue.toLocaleString('es-CL');
  }


}
