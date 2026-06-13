import { HttpInterceptorFn } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastInfo {
  icon: string;
  message: string;
  classname: string;
  delay?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private toastSubject = new Subject<ToastInfo>();
  toastState = this.toastSubject.asObservable();

  show(icon : string, message: string, classname = 'text-white', delay = 3000) {
    this.toastSubject.next({ icon , message, classname, delay });
  }

  // Helpers
  success(message: string) {
    this.show('bi bi-check-square-fill', message, 'text-success-toast');
  }

  error(message: string) {
    this.show('bi bi-exclamation-octagon-fill', message, 'text-danger');
  }

  info(message: string) {
    this.show('bi bi-exclamation-circle-fill', message, 'text-info');
  }

  warning(message: string) {
    this.show('bi bi-exclamation-diamond-fill', message, 'text-warning');
  }
}
