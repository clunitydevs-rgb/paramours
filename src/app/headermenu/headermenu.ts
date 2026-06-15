import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { MethodService } from './../method/method.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../service/toast.service';
declare var bootstrap: any;

@Component({
  selector: 'app-headermenu',
  imports: [CommonModule, RouterLink],
  templateUrl: './headermenu.html',
  styleUrl: './headermenu.css'
})
export class Headermenu implements OnInit {
  //public sUrlRps: string = "https://demofilesblobazure.blob.core.windows.net/rpsfilescontainer/";
  public sUrlRps: string = "https://paramoursfilesblobazure.blob.core.windows.net/rpsfilescontainer/";
  public sFotoPerfil: string | null = null;
  public avatarUrl: string | null = null;// string = this.proFileImg;
  public bShowLoginAndRegister = false;
  public sTypeUser: string | null = null;

  constructor(
    private methodservice: MethodService,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.refreshAvatar();

    this.methodservice.isLoggedIn$.subscribe(status => {
      this.bShowLoginAndRegister = status;
      this.refreshAvatar();
    });

    /*if ((this.methodservice.getItemLocalStorage("cl.paramours.sUid") != null) && (this.methodservice.getItemSessionStorage("cl.paramours.sUid") != '')) {
      this.bShowLoginAndRegister = true;
    } else {
      this.methodservice.tShowMenu.subscribe((data: boolean) => {
        this.bShowLoginAndRegister = data;
      })
    }*/
  }

  goLogout() {
    this.methodservice.delUserLocalStorage();
    this.refreshAvatar();
    this.router.navigate(['/home']);
    this.toastService.success('Sesión cerrada exitosamente!');
  }

  closeOffcanvas(id: string) {
    if (typeof window === 'undefined') return;

    const element = document.getElementById(id);

    if (element && (window as any).bootstrap) {
      const bs = (window as any).bootstrap;

      const instance = bs.Offcanvas.getInstance(element)
        || new bs.Offcanvas(element);

      instance.hide();
    }
  }

  private refreshAvatar() {
    this.sFotoPerfil = this.methodservice.getItemLocalStorage("cl.paramours.sFotoPerfl");
    this.sTypeUser = this.methodservice.getItemLocalStorage("cl.paramours.typeuser");

    if (!this.sFotoPerfil) {
      if (this.sTypeUser === '2')
        this.avatarUrl = this.sUrlRps + 'avatar_anunciante.png';
      else
        this.avatarUrl = this.sUrlRps + 'avatar_visitante.png';
      return;
    }

    this.avatarUrl = this.sFotoPerfil.startsWith('http')
      ? this.sFotoPerfil
      : this.sUrlRps + this.sFotoPerfil;
  }
}
