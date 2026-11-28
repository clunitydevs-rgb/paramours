import type { Cliente } from './models.interface';

export interface ProfilePlace {
  id: string | number;
  nombre: string;
  slug?: string;
  id_ciudad?: string | number;
}

export interface ProfileLocation {
  city: string;
  commune: string;
  primary: string;
  label: string;
  directoryUrl: string;
}

export const emptyProfileLocation = (): ProfileLocation => ({
  city: '', commune: '', primary: '', label: '', directoryUrl: ''
});

export function profileCategory(value: unknown): { singular: string; plural: string } {
  switch (String(value)) {
    case '0': return { singular: 'Masajista', plural: 'Masajistas' };
    case '1': return { singular: 'Escort', plural: 'Escorts' };
    default: return { singular: 'Perfil', plural: 'Perfiles' };
  }
}

const clean = (value: unknown): string => typeof value === 'string'
  ? value.replace(/[\u200b-\u200f\u202a-\u202e\u2060\ufeff]/g, '').replace(/\s+/g, ' ').trim() : '';
const hasId = (value: unknown): boolean => value !== null && value !== undefined && String(value).trim() !== '';

export function resolveProfileLocation(
  profile: Pick<Cliente, 'ciudad' | 'comuna'>,
  cities: readonly ProfilePlace[], communes: readonly ProfilePlace[]
): ProfileLocation {
  const declaredCity = hasId(profile.ciudad) ? cities.find(c => String(c.id) === String(profile.ciudad)) : undefined;
  const candidate = hasId(profile.comuna) ? communes.find(c => String(c.id) === String(profile.comuna)) : undefined;
  const parent = candidate && hasId(candidate.id_ciudad)
    ? cities.find(c => String(c.id) === String(candidate.id_ciudad)) : undefined;
  // A commune ID alone never makes it a commune of the declared city.
  const commune = parent && (!hasId(profile.ciudad) || parent === declaredCity) ? candidate : undefined;
  const city = declaredCity ?? (commune ? parent : undefined);
  const cityName = clean(city?.nombre), communeName = clean(commune?.nombre);
  const primary = communeName || cityName;
  const slug = commune?.slug || city?.slug;
  return { city: cityName, commune: communeName, primary,
    label: communeName && cityName && communeName !== cityName ? `${communeName}, ${cityName}` : primary,
    directoryUrl: primary && slug && /^[a-z0-9-]+$/.test(slug) ? `/escort-${slug}` : '' };
}

function removeMarkup(value: string): string {
  return value
    .replace(/<!--[\s\S]*?(?:-->|$)/g, ' ')
    .replace(/<(script|style|noscript|iframe|object|svg|math|template)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, ' ')
    // Quoted > characters are attributes, never descriptive text.
    .replace(/<(?:"[^"]*"|'[^']*'|[^'">])*>/g, ' ')
    .replace(/<[^>]*$/g, ' ');
}

export function publicDescriptionText(value: unknown, document: Document): string {
  if (typeof value !== 'string') return '';
  // Bounded work; only an inert textarea decodes entities. Nothing is attached to DOM.
  const decoder = document.createElement('textarea');
  decoder.innerHTML = removeMarkup(value.slice(0, 32768));
  return clean(removeMarkup(decoder.value))
    .replace(/(?:https?:\/\/|www\.)\S+/gi, '')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '')
    .replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/([¿¡])\s+/g, '$1').trim();
}

function excerpt(text: string, budget: number): string {
  if (text.length <= budget) return text;
  const window = text.slice(0, budget + 1);
  const endings = [...window.matchAll(/[.!?;](?=\s|$)/g)].map(m => m.index! + 1);
  const end = endings.filter(n => n >= Math.min(45, budget / 2)).at(-1);
  if (end) return text.slice(0, end).trim();
  const clause = [...window.matchAll(/,(?=\s)/g)].map(m => m.index!)
    .filter(n => n >= Math.min(45, budget / 2)).at(-1);
  if (clause) return text.slice(0, clause).trim() + '…';
  if (window.lastIndexOf(' ') < 1) return '';
  const words = window.slice(0, window.lastIndexOf(' ')).trim().replace(/[,;:]+$/, '').split(/\s+/);
  while (words.length && /^(?:y|e|o|u|de|del|en|con|para|por|que|a|al|un|una|el|la|los|las|mi|mis|tu|tus|soy|muy)$/i.test(words.at(-1)!)) words.pop();
  return words.join(' ') + '…';
}

export function profileIdentity(profile: Pick<Cliente, 'nombrE_USUARIO' | 'genero'>, location: ProfileLocation) {
  const name = clean(profile.nombrE_USUARIO) || 'Perfil Paramours';
  const category = profileCategory(profile.genero);
  const geographic = location.label ? ` en ${location.label}` : '';
  return { name, category, geographic,
    title: `${name} - ${category.singular}${geographic} | Paramours`,
    heading: `${name}, ${category.singular}${geographic}` };
}

export function buildProfileSeo(profile: Cliente, location: ProfileLocation, document: Document) {
  const { name, category, geographic, title, heading } = profileIdentity(profile, location);
  const context = `${name}, ${category.singular.toLowerCase()}${geographic}.`;
  const published = publicDescriptionText(profile.descripcion, document).replace(/[“”«»]/g, '');
  const age = Number(profile.edad);
  let ageConflict = false;
  const text = Number.isInteger(age) && age >= 18 && age <= 120
    ? (published.match(/[^.!?]+[.!?]*/g) ?? []).filter(sentence => {
      const conflict = [...sentence.matchAll(/\btengo\s+(\d{1,3})\s+años\b/gi)].some(m => Number(m[1]) !== age);
      ageConflict ||= conflict;
      return !conflict;
    }).join(' ').replace(/\s+/g, ' ').trim()
    : published;
  const useful = (text.match(/\p{L}/gu)?.length ?? 0) >= 20 && text.split(/\s+/).length >= 4;
  const extract = useful ? excerpt(text, Math.max(70, 205 - context.length)) : '';
  // A readable extract of the actual text, not newly attributed services or qualities.
  const description = extract ? `${context} ${extract}` : context;
  return { name, category, description, descriptionSource: extract ? 'published' as const : 'fallback' as const,
    descriptionWarnings: ageConflict ? ['age-conflict'] : [], title, heading };
}
