import { BlogPost, isPublishedBlog } from './app/models/blog.interface';

const SITE_URL = 'https://paramours.cl';
const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';

export interface SitemapProfile extends Record<string, unknown> {
  iD_USUARIO?: string | number;
  nombrE_USUARIO?: string;
  slug?: string;
  ciudad?: string | number;
  comuna?: string | number;
  estado?: string;
}

export interface SitemapLocation {
  id: string | number;
  slug: string;
}

interface SitemapEntry {
  lastmod?: string;
  loc: string;
  changefreq: 'daily';
  priority: '1.0' | '0.9';
}

export function buildSitemapXml(
  profiles: SitemapProfile[],
  communes: SitemapLocation[],
  cities: SitemapLocation[],
  posts: BlogPost[] = []
): string {
  const activeProfiles = profiles.filter(isPublicActiveProfile);
  const activeCommuneIds = getActiveProfileLocationIds(activeProfiles, 'comuna');
  const activeCityIds = getActiveProfileLocationIds(activeProfiles, 'ciudad');
  const entries = new Map<string, SitemapEntry>();

  addEntry(entries, `${SITE_URL}/`, '1.0');
  addEntry(entries, `${SITE_URL}/blog`, '0.9');
  for (const post of posts.filter(isPublishedBlog).filter(post => post.isIndexable === true)) {
    const loc = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`;
    addEntry(entries, loc, '0.9');
    // SQL dates have no offset: use their calendar date without inventing a timezone.
    if (/^\d{4}-\d{2}-\d{2}T/.test(post.modifiedDate) && Number.isFinite(Date.parse(post.modifiedDate))) {
      entries.get(loc)!.lastmod = post.modifiedDate.slice(0, 10);
    }
  }

  for (const city of cities) {
    if (isValidLocation(city) && activeCityIds.has(normalizeId(city.id))) {
      addEntry(entries, `${SITE_URL}/escort-${city.slug}`, '0.9');
    }
  }

  for (const commune of communes) {
    if (isValidLocation(commune) && activeCommuneIds.has(normalizeId(commune.id))) {
      addEntry(entries, `${SITE_URL}/escort-${commune.slug}`, '0.9');
    }
  }

  for (const profile of activeProfiles) {
    const profileUrl = buildProfileUrl(profile);
    if (profileUrl) {
      addEntry(entries, profileUrl, '0.9');
    }
  }

  const xmlEntries = [...entries.values()].map(entry => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ''}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="${SITEMAP_NAMESPACE}">
${xmlEntries}
</urlset>
`;
}

export function getActiveProfileLocationIds(
  profiles: SitemapProfile[],
  locationField: 'ciudad' | 'comuna'
): Set<string> {
  return new Set(
    profiles
      .filter(isPublicActiveProfile)
      .map(profile => normalizeId(profile[locationField]))
      .filter(Boolean)
  );
}
export function isPublicActiveProfile(profile: SitemapProfile): boolean {
  const state = profile.estado;
  return state === undefined || state === null || state === '' || state.toUpperCase() === 'V';
}

function buildProfileUrl(profile: SitemapProfile): string | null {
  const id = normalizeId(profile.iD_USUARIO);
  const rawSlug = String(profile.slug || `Escort-${profile.nombrE_USUARIO || ''}`)
    .replace(/[\r\n]/g, '')
    .trim();

  if (!id || !rawSlug) {
    return null;
  }

  const encodedSlug = encodeURIComponent(rawSlug).replace(/%2F/gi, '-');
  return `${SITE_URL}/profile/${encodeURIComponent(id)}/${encodedSlug}`;
}

function addEntry(entries: Map<string, SitemapEntry>, rawUrl: string, priority: SitemapEntry['priority']): void {
  const loc = normalizeCanonicalUrl(rawUrl);
  if (!loc || entries.has(loc)) {
    return;
  }

  entries.set(loc, { loc, changefreq: 'daily', priority });
}

function normalizeCanonicalUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'paramours.cl') {
      return null;
    }

    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function isValidLocation(location: SitemapLocation): boolean {
  return Boolean(normalizeId(location.id) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(location.slug));
}

function normalizeId(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim();
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
