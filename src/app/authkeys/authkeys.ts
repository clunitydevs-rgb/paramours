import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ChangePassword } from '../models/models.interface';
import { ApiServices } from '../api/api.service';
import { ToastService } from '../service/toast.service';
import { AnalyticsService } from '../service/analytics.service';
import { ResponseClient } from '../models/response.interface';
import { Router } from '@angular/router';

const samePasswordValidator = (control: AbstractControl): ValidationErrors | null => {
  const newPassword = control.get('nuevaclave')?.value;
  const repeatedPassword = control.get('reingresanuevaclave')?.value;

  if (!newPassword || !repeatedPassword) {
    return null;
  }

  return newPassword === repeatedPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-authkeys',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './authkeys.html',
  styleUrl: './authkeys.css'
})
export class Authkeys {

  constructor(
    private api: ApiServices,
    private toastService: ToastService,
    private router: Router,
    private analyticsService: AnalyticsService
  ) { }

  frmClave = new FormGroup({
    nuevaclave: new FormControl('', [Validators.required, Validators.minLength(4)]),
    reingresanuevaclave: new FormControl('', [Validators.required])
  }, { validators: samePasswordValidator });

  get newPassword() {
    return this.frmClave.get('nuevaclave') as FormControl;
  }

  get repeatedPassword() {
    return this.frmClave.get('reingresanuevaclave') as FormControl;
  }

  ChangePassword: ChangePassword = {
    sPwd: ''
  }

  goChangePassword() {
    if (this.frmClave.invalid) {
      this.frmClave.markAllAsTouched();
      return;
    }

    this.ChangePassword.sPwd = this.frmClave.get('repeat-password')?.value!;

    console.log('sPwd : ' + this.ChangePassword.sPwd);
    console.log('ChangePassword : ' + this.ChangePassword);
    
    this.api.ChangePasswordProfile(this.ChangePassword).subscribe({
      next: (data: ResponseClient) => {
        this.toastService.success('Cambio de clave exitoso!');
        this.router.navigate(['/home']);
      },
      error: err => {
        this.toastService.error('Problemas con los servicios para cambiar clave!');
      }
    });

  }
}
