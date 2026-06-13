import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

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

  goChangePassword() {
    if (this.frmClave.invalid) {
      this.frmClave.markAllAsTouched();
      return;
    }
  }

}
