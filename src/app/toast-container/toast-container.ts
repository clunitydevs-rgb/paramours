import { Component, OnInit } from '@angular/core';
import { ToastService, ToastInfo } from '../service/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast-container',
  imports: [CommonModule],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css'
})
export class ToastContainer implements OnInit {
  toasts: ToastInfo[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.toastService.toastState.subscribe(toast => {
      if (this.toasts.length >= 4) {
        this.toasts.shift();
      }

      this.toasts.push(toast);

      setTimeout(() => {
        this.removeToast(toast);
      }, toast.delay || 60000);
    });
  }

  removeToast(toast: ToastInfo) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }
}
