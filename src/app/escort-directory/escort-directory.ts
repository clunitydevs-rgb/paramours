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
  idComuna?: string | number;
  idMetro?: string | number;
  NombreMetro?: string;
}

type LocationType = 'city' | 'commune' | 'metro';

interface LocalContent {
  intro: string;
  heading: string;
  paragraphs: string[];
  faqs: Array<{ question: string; answer: string }>;
}

const LOCATION_ALIASES: Record<string, string> = {
  'santiago-providencia': 'providencia',
  'santiago-las-condes': 'las-condes',
  'santiago-la-reina': 'la-reina',
  'santiago-las-reina': 'la-reina',
  'santiago-san-miguel': 'san-miguel',
  'santiago-lo-prado': 'lo-prado'
};

const LOCAL_CONTENT: Record<string, LocalContent> = {
  santiago: {
    intro: 'Encuentra escorts, acompañantes VIP y cariñosas en Santiago con perfiles verificados, fotografías reales y contacto directo.',
    heading: 'Acompañantes VIP, cariñosas y masajes sensitivos en Santiago',
    paragraphs: [
      'Paramours reúne anuncios de acompañantes independientes en Santiago para comparar perfiles, comunas y servicios antes de contactar directamente. La disponibilidad se actualiza según los anuncios activos.',
      'Si buscas sexo en Santiago, acompañantes VIP o masajes sensitivos en Santiago, revisa la descripción de cada perfil y confirma directamente servicios, horarios, ubicación y condiciones.',
      'Puedes explorar cariñosas en Santiago Centro, Providencia, Las Condes, La Reina, San Miguel y otras comunas con perfiles disponibles.'
    ],
    faqs: [
      { question: '¿Dónde encontrar acompañantes VIP en Santiago?', answer: 'Consulta los perfiles activos, compara sus ubicaciones y utiliza únicamente los datos de contacto publicados por cada anunciante.' },
      { question: '¿Hay masajes sensitivos en Santiago?', answer: 'Algunas anunciantes pueden incluir masajes sensitivos entre sus servicios. Confirma siempre la información directamente en cada perfil.' },
      { question: '¿Cómo encontrar cariñosas en Santiago?', answer: 'Utiliza los directorios por comuna de Paramours para revisar perfiles activos en Las Condes, Providencia, Santiago Centro y otros sectores.' },
      { question: '¿Los perfiles de Santiago están verificados?', answer: 'Los anuncios identificados con el distintivo Verificado han completado el proceso de verificación de Paramours.' }
    ]
  },
  calama: {
    intro: 'Directorio de escorts y damas de compañía en Calama con contacto directo y anuncios actualizados.',
    heading: 'Escorts y damas de compañía en Calama',
    paragraphs: ['Consulta la disponibilidad de acompañantes independientes en Calama y revisa cada perfil antes de establecer contacto.'],
    faqs: [{ question: '¿Hay escorts disponibles en Calama?', answer: 'La disponibilidad depende de los perfiles activos publicados en Paramours y puede cambiar diariamente.' }]
  },
  antofagasta: {
    intro: 'Encuentra escorts en Antofagasta mediante perfiles independientes, información actualizada y contacto directo.',
    heading: 'Acompañantes disponibles en Antofagasta',
    paragraphs: ['Paramours organiza los perfiles por ubicación para facilitar la búsqueda de acompañantes en Antofagasta.'],
    faqs: [{ question: '¿Cómo revisar la disponibilidad en Antofagasta?', answer: 'Los perfiles visibles en esta página corresponden a anunciantes activas asociadas a Antofagasta.' }]
  },
  'santiago-las-condes-manquehue': {
    intro: 'Explora acompañantes y servicios de masajes cerca de Manquehue, en Las Condes.',
    heading: 'Escorts y masajes en Manquehue',
    paragraphs: ['Consulta perfiles activos próximos al sector de Metro Manquehue y contacta directamente para confirmar ubicación y servicios.'],
    faqs: [{ question: '¿Cómo encontrar masajes cerca de Manquehue?', answer: 'Revisa los perfiles activos del sector y confirma directamente con cada anunciante los servicios y la ubicación.' }]
  }
};

@Component({
  selector: 'app-escort-directory',
  imports: [CommonModule, RouterLink],
  templateUrl: './escort-directory.html',
  styleUrls: ['../home/home.css', './escort-directory.css']
})
export class EscortDirectory implements OnInit {
  readonly sUrlRps = 'https://paramoursfilesblobazure.blob.core.windows.net/rpsfilescontainer/';
  readonly proFileImg = `${this.sUrlRps}avatar_anunciante.png`;
  readonly relatedLocations = [
    { label: 'Santiago', url: '/escorts-santiago' },
    { label: 'Las Condes', url: '/escorts-santiago-las-condes' },
    { label: 'Providencia', url: '/escorts-santiago-providencia' },
    { label: 'Santiago Centro', url: '/escorts-santiago-centro' },
    { label: 'La Reina', url: '/escorts-santiago-la-reina' },
    { label: 'San Miguel', url: '/escorts-santiago-san-miguel' },
    { label: 'Lo Prado', url: '/escorts-santiago-lo-prado' }
  ];

  slug = '';
  locationName = '';
  locationType: LocationType = 'city';
  locationId: string | number | null = null;
  profiles: Cliente[] = [];
  loading = true;
  loadError = false;
  content: LocalContent | null = null;

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
      comunas: this.api.getComunas(),
      metros: this.api.getMetros()
    }).subscribe({
      next: ({ clients, ciudades, comunas, metros }) => {
        const resolvedSlug = LOCATION_ALIASES[this.slug] ?? this.slug;
        const city = (ciudades as LocationItem[]).find(item => item.slug === resolvedSlug);
        const commune = (comunas as LocationItem[]).find(item => item.slug === resolvedSlug);
        const metro = this.slug === 'santiago-las-condes-manquehue'
          ? (metros as LocationItem[]).find(item => item.NombreMetro?.toLowerCase() === 'manquehue')
          : undefined;
        const location = metro ?? commune ?? city;

        if (!location) {
          void this.router.navigateByUrl('/404', { replaceUrl: true });
          return;
        }

        this.locationType = metro ? 'metro' : commune ? 'commune' : 'city';
        this.locationId = metro ? metro.idMetro ?? null : location.id;
        this.locationName = metro ? 'Manquehue, Las Condes' : location.nombre;
        this.content = LOCAL_CONTENT[this.slug] ?? this.buildDefaultContent(this.locationName);

        if (!clients) {
          this.loadError = true;
          this.loading = false;
          this.updateSeo();
          return;
        }

        const responseClients = clients.oClient as unknown;
        const allProfiles = Array.isArray(responseClients) ? responseClients as Cliente[] : [];
        this.profiles = allProfiles.filter(profile => this.matchesLocation(profile));
        this.loading = false;
        this.updateSeo();
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
        this.updateSeo();
      }
    });
  }

  get visibleRelatedLocations() {
    const currentUrl = `/escorts-${this.slug}`;
    return this.relatedLocations.filter(location => location.url !== currentUrl);
  }

  getProfileUrl(profile: Cliente): string {
    return `/profile/${profile.iD_USUARIO}/${(profile as any).slug ?? ''}`;
  }

  trackProfile(_index: number, profile: Cliente): number {
    return profile.iD_USUARIO;
  }

  private matchesLocation(profile: Cliente): boolean {
    if (this.locationId === null) return false;
    const value = this.locationType === 'metro'
      ? profile.metro
      : this.locationType === 'commune' ? profile.comuna : profile.ciudad;
    return value?.toString() === this.locationId.toString();
  }

  private updateSeo(): void {
    if (!this.locationName || !this.content) return;
    this.seoService.setLocationSeo({
      locationName: this.locationName,
      slug: this.slug,
      description: this.content.intro,
      profileCount: this.profiles.length,
      faqs: this.content.faqs
    });
  }

  private buildDefaultContent(locationName: string): LocalContent {
    return {
      intro: `Explora perfiles verificados de escorts en ${locationName}, con fotografías reales y contacto directo.`,
      heading: `Acompañantes disponibles en ${locationName}`,
      paragraphs: [`Paramours reúne perfiles de escorts en ${locationName} para consultar información actualizada y contactar directamente con cada anunciante.`],
      faqs: [{ question: `¿Cómo contactar escorts en ${locationName}?`, answer: 'Selecciona un perfil activo y utiliza los datos de contacto publicados por la anunciante.' }]
    };
  }
}