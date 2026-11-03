export interface SeoPageConfig {
  path: string;
  aliases?: readonly string[];
  title: string;
  description: string;
  h1: string;
  intro: string;
  heading: string;
  paragraphs: string[];
  canonicalPath: string;
  indexable: boolean;
  locationSlug?: string;
}

// Keep legacy entry URLs while using Paramours-only visible content and metadata.
const neutralDirectory = (path: string, canonicalPath = `/${path}`, aliases?: readonly string[]): SeoPageConfig => ({
  path, aliases, title: 'Escorts en Chile | Paramours',
  description: 'Explora los perfiles publicados en Paramours y revisa la informaci\u00f3n de cada anunciante.',
  h1: 'Escorts en Chile | Paramours',
  intro: 'Explora los perfiles publicados en Paramours y revisa la informaci\u00f3n de cada anunciante.',
  heading: '', paragraphs: [], canonicalPath, indexable: true
});

const directory = (path: string, h1: string, intro: string, heading: string, paragraphs: string[], locationSlug?: string): SeoPageConfig => ({
  path, title: `${h1} | Paramours`, description: intro, h1, intro, heading, paragraphs,
  canonicalPath: `/${path}`, indexable: true, locationSlug
});

export const SEO_PAGES: readonly SeoPageConfig[] = [
  neutralDirectory('skokka-com/chile'),
  neutralDirectory('locanto-cl', '/locanto-cl/'),
  neutralDirectory('gemidos-tv', '/gemidos-tv/', ['gemidos-tv/chile']),
  { ...directory('escort', 'Escort en Chile', 'Conoce el directorio de Paramours y explora perfiles independientes en Chile.', 'Cómo explorar un perfil escort', ['Revisa los datos publicados y utiliza los medios de contacto de cada anunciante.']), canonicalPath: '/escorts-chile', indexable: false },
  { ...directory('escorts', 'Directorio de escorts', 'Explora perfiles de escorts independientes y sus historias en Paramours.', 'Elegir perfiles por ubicación', ['Puedes recorrer el catálogo nacional o acceder a los directorios por ciudad y comuna.']), canonicalPath: '/escorts-chile', indexable: false },
  directory('escorts-chile', 'Escorts en Chile', 'Explora escorts independientes en Chile: perfiles publicados, historias y contacto directo en Paramours.', 'Un catálogo nacional organizado por ubicación', ['El catálogo reúne anunciantes de las ciudades y comunas disponibles. Las ubicaciones enlazadas permiten acotar la búsqueda a los perfiles activos de cada sector.', 'Cada anunciante gestiona su información y sus condiciones. Consulta su perfil antes de contactar y confirma disponibilidad directamente.']),
  directory('sexo-chile', 'Sexo en Chile: información y perfiles para adultos', 'Información para adultos que buscan sexo en Chile y quieren revisar perfiles independientes publicados en Paramours.', 'Información antes de establecer contacto', ['Paramours permite consultar anuncios de personas adultas independientes. La publicación de un perfil no garantiza disponibilidad ni servicios concretos.', 'Antes de coordinar, conversa sobre límites, consentimiento y condiciones. Los acuerdos corresponden exclusivamente a las personas involucradas.']),
  directory('sexo-santiago', 'Sexo en Santiago: perfiles e información', 'Consulta perfiles independientes en Santiago y revisa información para adultos antes de contactar en Paramours.', 'Buscar por sectores de Santiago', ['Esta selección corresponde a perfiles asociados a Santiago. Puedes consultar las comunas disponibles para precisar tu búsqueda.', 'Confirma directamente el sector, los horarios y las condiciones. La ubicación publicada sirve como referencia y no implica disponibilidad inmediata.'], 'santiago'),
  directory('sexo-providencia', 'Sexo en Providencia: perfiles para adultos', 'Revisa perfiles independientes asociados a Providencia, Santiago, y sus medios de contacto en Paramours.', 'Perfiles y ubicación en Providencia', ['El catálogo se limita a anunciantes cuya ciudad y comuna corresponden a Providencia en Santiago.', 'Consulta el perfil para conocer la información publicada y confirma el punto de encuentro y la disponibilidad directamente.'], 'providencia'),
  directory('sexo-las-condes', 'Sexo en Las Condes: perfiles para adultos', 'Explora perfiles independientes de Las Condes, Santiago, con información y contacto directo en Paramours.', 'Orientar la búsqueda en Las Condes', ['Los perfiles de esta página están asociados a Las Condes y a su ciudad correspondiente. Revisa las referencias de sector de cada anuncio.', 'La cercanía a un metro o sector no garantiza atención allí. Confirma la ubicación exacta y las condiciones mediante el contacto del perfil.'], 'las-condes'),
  neutralDirectory('sectorvip'),
  directory('masajes-sensitivos', 'Masajes sensitivos en Chile', 'Información sobre masajes sensitivos en Chile y acceso a perfiles independientes para consultar servicios en Paramours.', 'Cómo consultar por masajes sensitivos', ['El catálogo muestra perfiles independientes; no todos anuncian masajes sensitivos. Revisa la descripción de cada perfil para identificar los servicios informados.', 'Consulta directamente técnicas, duración, tarifas y límites antes de reservar. Paramours no garantiza que un servicio está disponible ni interviene en la coordinación.'])
];

export function findSeoPage(path: string): SeoPageConfig | undefined {
  return SEO_PAGES.find(page => [page.path, ...(page.aliases ?? [])].some(route => `/${route}` === path.replace(/\/$/, '')));
}

export interface SeoLocation { id: string | number; slug: string; id_ciudad?: string | number; }
export function matchesSeoPageLocation(
  page: SeoPageConfig, profile: { ciudad?: string | number; comuna?: string | number },
  cities: SeoLocation[], communes: SeoLocation[]
): boolean {
  if (!page.locationSlug) return true;
  const commune = communes.find(item => item.slug === page.locationSlug);
  if (commune) return commune.id_ciudad != null
    && String(profile.ciudad) === String(commune.id_ciudad)
    && String(profile.comuna) === String(commune.id);
  const city = cities.find(item => item.slug === page.locationSlug);
  return !!city && String(profile.ciudad) === String(city.id);
}
