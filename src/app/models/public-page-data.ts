import type { Cliente } from './models.interface';

export type ProfileLookup =
  | { kind: 'found'; profile: Cliente }
  | { kind: 'missing' }
  | { kind: 'unavailable' };

// Only fields rendered by public pages. Never serialize an API response wholesale.
const publicFields = [
  'iD_USUARIO', 'nombrE_USUARIO', 'slug', 'edad', 'celular', 'genero',
  'nacionalidad', 'medidas', 'altura', 'peso', 'horariO_ATENCION',
  'horariO_PART_TIME', 'ciudad', 'comuna', 'metro', 'valor', 'colorojos',
  'colorcabello', 'biotipo', 'descripcion', 'estado', 'tipo', 'fotO_PERFIL'
] as const;

const catalogFields = ['iD_USUARIO', 'nombrE_USUARIO', 'slug', 'edad', 'genero',
  'ciudad', 'comuna', 'metro', 'valor', 'fotO_PERFIL', 'estado'] as const;

export function publicProfile(value: unknown): Cliente {
  const source = value as Record<string, unknown>;
  return Object.fromEntries(publicFields.filter(key => Object.hasOwn(source, key) &&
      (source[key] == null || ['string', 'number', 'boolean'].includes(typeof source[key])))
    .map(key => [key, source[key]])) as unknown as Cliente;
}

export function classifyProfile(value: unknown, requestedId: number): ProfileLookup {
  if (!value || typeof value !== 'object') return { kind: 'unavailable' };
  const payload = value as { ncoderror?: unknown; oClient?: Cliente | null };
  if (String(payload.ncoderror) === '1' && payload.oClient == null) return { kind: 'missing' };
  const profile = payload.oClient;
  if (String(payload.ncoderror) !== '0' || !profile ||
    Number(profile.iD_USUARIO) !== requestedId || typeof profile.nombrE_USUARIO !== 'string' ||
    !profile.nombrE_USUARIO.trim() || typeof profile.estado !== 'string' || !profile.estado) {
    return { kind: 'unavailable' };
  }
  return { kind: 'found', profile: publicProfile(profile) };
}

export function publicCatalog(value: unknown): Cliente[] {
  const payload = value as { ncoderror?: unknown; oClient?: unknown[] } | null;
  if (!payload || (payload.ncoderror != null && String(payload.ncoderror) !== '0') ||
    !Array.isArray(payload.oClient) || payload.oClient.some(item => !item || typeof item !== 'object' ||
      !Number.isSafeInteger(Number((item as Cliente).iD_USUARIO)) || Number((item as Cliente).iD_USUARIO) <= 0 ||
      typeof (item as Cliente).nombrE_USUARIO !== 'string' || !(item as Cliente).nombrE_USUARIO.trim())) {
    throw new Error('Invalid public catalog response');
  }
  return payload.oClient.map(value => {
    const source = publicProfile(value) as unknown as Record<string, unknown>;
    return Object.fromEntries(catalogFields.filter(key => Object.hasOwn(source, key))
      .map(key => [key, source[key]])) as unknown as Cliente;
  });
}
