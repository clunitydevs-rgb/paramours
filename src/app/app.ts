import { Component, signal, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { Headermenu } from './headermenu/headermenu';
import { NgxSpinnerModule } from 'ngx-spinner';
import { CommonModule } from '@angular/common';
import { ToastContainer } from "./toast-container/toast-container";
import { Footer } from "./footer/footer";
import { MethodService } from './method/method.service';
import { filter } from 'rxjs/operators';
import { AnalyticsService } from './service/analytics.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LegalModals } from './public/legal-modals/legal-modals';

@Component({
  selector: 'app-root',
  imports: [CommonModule, Headermenu, NgxSpinnerModule, ToastContainer, Footer, RouterOutlet, LegalModals],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('cl.app.paramours');


  constructor(
    private methodservice: MethodService,
    private router: Router,
    private analyticsService: AnalyticsService
  ) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        this.analyticsService.trackPage(event.urlAfterRedirects);
      });
  }

  ngOnInit(): void {
    if (this.esReingresoDespuesDe30Min()) {
      console.log('El usuario volvió después de 30 minutos');
      this.methodservice.delUserLocalStorage(); // eliminar datos de usuario para forzar nuevo login
      
    }
  }

  esReingresoDespuesDe30Min(): boolean {
    const fechaGuardada = this.methodservice.getItemLocalStorage('fechaIngreso');

    if (!fechaGuardada) return false;

    const ingresoAnterior = parseInt(fechaGuardada, 10);
    const ahora = Date.now();

    const diferenciaMs = ahora - ingresoAnterior;

    const treintaMinutos = 30 * 60 * 1000;

    return diferenciaMs >= treintaMinutos;
  }

}
