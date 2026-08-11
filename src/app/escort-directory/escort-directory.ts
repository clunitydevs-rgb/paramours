import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of, timeout } from 'rxjs';
import { ApiServices } from '../api/api.service';
import { Cliente } from '../models/models.interface';
import { LocationSeoService } from '../service/location-seo.service';
import { SeoService } from '../service/seo.service';
import { SsrResponseService } from '../service/ssr-response.service';
import { Pagenotfound } from '../pagenotfound/pagenotfound';

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


const LOCAL_CONTENT: Record<string, LocalContent> = {
  santiago: {
    intro: 'Encuentra escorts, acompañantes VIP y cariñosas en Santiago con perfiles verificados, fotografías reales y contacto directo.',
    heading: 'Acompañantes VIP, cariñosas y masajes sensitivos en Santiago',
    paragraphs: [
      'Paramours reúne anuncios de acompañantes independientes en Santiago para comparar perfiles, comunas y servicios antes de contactar directamente. La disponibilidad se actualiza según los anuncios activos.',
      'Si buscas sexo en Santiago, acompañantes VIP o masajes sensitivos en Santiago, revisa la descripción de cada perfil y confirma directamente servicios, horarios, ubicación y condiciones.',
      'Puedes explorar cariñosas en Santiago Centro, Providencia, Las Condes, La Reina, San Miguel y otras comunas con perfiles disponibles.',
      'El directorio permite revisar fotografías, datos generales y referencias de ubicación antes de elegir. Cada anunciante administra su información y establece de manera independiente sus horarios, tarifas y formas de atención.',
      'Para una búsqueda más precisa, utiliza los enlaces por comuna y revisa únicamente perfiles publicados. Antes de coordinar, confirma directamente la disponibilidad, el sector exacto y las condiciones del encuentro. Paramours está dirigido exclusivamente a personas adultas y facilita el contacto sin intervenir en los acuerdos entre usuarios y anunciantes.'
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
  manquehue: {
    intro: 'Explora acompañantes y servicios de masajes cerca de Manquehue, en Las Condes.',
    heading: 'Escorts y masajes en Manquehue',
    paragraphs: ['Consulta perfiles activos próximos al sector de Metro Manquehue y contacta directamente para confirmar ubicación y servicios.'],
    faqs: [{ question: '¿Cómo encontrar masajes cerca de Manquehue?', answer: 'Revisa los perfiles activos del sector y confirma directamente con cada anunciante los servicios y la ubicación.' }]
  }
};

@Component({
  selector: 'app-escort-directory',
  imports: [CommonModule, RouterLink, Pagenotfound],
  templateUrl: './escort-directory.html',
  styleUrls: ['../home/home.css', './escort-directory.css']
})
export class EscortDirectory implements OnInit {
  readonly sUrlRps = 'https://paramoursfilesblobazure.blob.core.windows.net/rpsfilescontainer/';
  readonly proFileImg = `${this.sUrlRps}avatar_anunciante.png`;
  relatedLocations: Array<{ label: string; url: string }> = [];

  slug = '';
  locationName = '';
  locationType: LocationType = 'city';
  locationId: string | number | null = null;
  profiles: Cliente[] = [];
  loading = true;
  loadError = false;
  notFound = false;
  content: LocalContent | null = null;

  constructor(
    private route: ActivatedRoute,
    private api: ApiServices,
    private seoService: LocationSeoService,
    private globalSeoService: SeoService,
    private ssrResponse: SsrResponseService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.slug = params.get('slug') ?? '';
      this.loadLocation();
    });
  }

  private loadLocation(): void {
    this.loading = true;
    this.loadError = false;
    this.notFound = false;
    this.profiles = [];
    this.locationName = '';
    this.content = null;

    forkJoin({
      clients: this.api.getClients().pipe(timeout(6000), catchError(() => of(null))),
      ciudades: this.api.getCiudades(),
      comunas: this.api.getComunas(),
      metros: this.api.getMetros()
    }).subscribe({
      next: ({ clients, ciudades, comunas, metros }) => {
        const city = (ciudades as LocationItem[]).find(item => item.slug === this.slug);
        const commune = (comunas as LocationItem[]).find(item => item.slug === this.slug);
        const metro = this.slug === 'manquehue'
          ? (metros as LocationItem[]).find(item => item.NombreMetro?.toLowerCase() === 'manquehue')
          : undefined;
        const location = metro ?? commune ?? city;

        if (!location) {
          this.loading = false;
          this.notFound = true;
          this.ssrResponse.setNotFound();
          this.globalSeoService.applyStaticRouteSeo('/404');
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
        this.relatedLocations = this.buildRelatedLocations(comunas as LocationItem[], allProfiles);
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

  get directoryIntro(): string {
    if (this.locationType === 'commune') {
      return `Encuentra perfiles de escorts y acompañantes adultas independientes en ${this.locationName}, Santiago. Revisa la información publicada por cada anunciante y accede a sus perfiles para conocer más detalles.`;
    }

    return this.content?.intro ?? '';
  }

  get visibleRelatedLocations() {
    const currentUrl = `/escort-${this.slug}`;
    return this.relatedLocations.filter(location => location.url !== currentUrl);
  }

  getProfileUrl(profile: Cliente): string {
    return `/profile/${profile.iD_USUARIO}/${(profile as any).slug ?? ''}`;
  }

  trackProfile(_index: number, profile: Cliente): number {
    return profile.iD_USUARIO;
  }

  private buildRelatedLocations(communes: LocationItem[], profiles: Cliente[]): Array<{ label: string; url: string }> {
    const activeCommuneIds = new Set(profiles.map(profile => profile.comuna?.toString()).filter(Boolean));
    const communeLinks = communes
      .filter(commune => commune.slug && activeCommuneIds.has(commune.id.toString()))
      .map(commune => ({ label: commune.nombre, url: `/escort-${commune.slug}` }))
      .sort((left, right) => left.label.localeCompare(right.label, 'es'));

    return [{ label: 'Santiago', url: '/escort-santiago' }, ...communeLinks];
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
      description: this.locationType === 'commune'
        ? `Explora escorts en ${this.locationName} en Paramours. Revisa perfiles de acompañantes adultas independientes, información publicada y medios de contacto.`
        : this.content.intro,
      profileCount: this.profiles.length,
      faqs: this.content.faqs,
      locationType: this.locationType
    });
  }

  private buildDefaultContent(locationName: string): LocalContent {
    return {
      intro: `Explora perfiles verificados de escorts en ${locationName}, con fotografías reales y contacto directo.`,
      heading: `Escorts y acompañantes disponibles en ${locationName}`,
      paragraphs: [
        `En Paramours puedes explorar perfiles de escorts en ${locationName} y revisar alternativas de acompañantes independientes disponibles en esta comuna de Santiago. El directorio reúne anuncios con fotografías, información general y medios de contacto publicados por cada anunciante, para que puedas comparar opciones de manera simple antes de comunicarte.`,
        `La disponibilidad de escorts en ${locationName} cambia de acuerdo con los perfiles activos. Revisa cada anuncio para conocer horarios, tarifas, características y servicios informados. Si necesitas confirmar el sector exacto, la cercanía con el metro o las condiciones de atención, consulta directamente con la persona elegida antes de coordinar cualquier encuentro.`,
        `Esta página organiza los perfiles asociados a ${locationName} y también ofrece enlaces hacia otras comunas de Santiago. Los anuncios identificados como verificados han completado el proceso de validación de Paramours. El sitio está dirigido exclusivamente a personas adultas y funciona como un espacio de publicación y contacto; cada anunciante gestiona de forma independiente su agenda, ubicación, servicios y condiciones. Utiliza siempre los datos publicados en el perfil y mantén una comunicación respetuosa y privada.`
      ],
      faqs: [{ question: `¿Cómo contactar escorts en ${locationName}?`, answer: 'Selecciona un perfil activo y utiliza los datos de contacto publicados por la anunciante.' }]
    };
  }
}