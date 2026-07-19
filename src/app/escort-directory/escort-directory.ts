import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of, timeout } from 'rxjs';
import { ApiServices } from '../api/api.service';
import { Cliente } from '../models/models.interface';
import { LocationSeoService } from '../service/location-seo.service';

interface LocationItem {
  id: string | number;
  nombre: string;
  slug: string;
}

@Component({
  selector: 'app-escort-directory',
  imports: [CommonModule, RouterLink],
  templateUrl: './escort-directory.html',
  styleUrl: '../home/home.css'
})
export class EscortDirectory implements OnInit {
  readonly sUrlRps = 'https://paramoursfilesblobazure.blob.core.windows.net/rpsfilescontainer/';
  readonly proFileImg = `${this.sUrlRps}avatar_anunciante.png`;
  slug = '';
  locationName = '';
  profiles: Cliente[] = [];
  loading = true;
  loadError = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiServices,
    private seoService: LocationSeoService
  ) { }

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';

    forkJoin({
      clients: this.api.getClients().pipe(timeout(6000), catchError(() => of(null))),
      ciudades: this.api.getCiudades(),
      comunas: this.api.getComunas()
    }).subscribe({
      next: ({ clients, ciudades, comunas }) => {
        const comuna = (comunas as LocationItem[]).find(item => item.slug === this.slug);
        const ciudad = (ciudades as LocationItem[]).find(item => item.slug === this.slug);
        const location = comuna ?? ciudad;

        if (!location) {
          void this.router.navigateByUrl('/404', { replaceUrl: true });
          return;
        }

        this.locationName = location.nombre;
        this.seoService.setLocationSeo(this.locationName, this.slug);

        if (!clients) {
          this.loadError = true;
          this.loading = false;
          return;
        }

        const responseClients = clients.oClient as unknown;
        const allProfiles = Array.isArray(responseClients) ? responseClients as Cliente[] : [];

        this.profiles = allProfiles.filter(profile => {
          const profileLocationId = comuna ? profile.comuna : profile.ciudad;
          return profileLocationId?.toString() === location.id.toString();
        });
        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      }
    });
  }

  getProfileUrl(profile: Cliente): string {
    return `/profile/${profile.iD_USUARIO}/${(profile as any).slug ?? ''}`;
  }

}
