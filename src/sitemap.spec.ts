import { buildSitemapXml, SitemapLocation, SitemapProfile } from './sitemap';

describe('Sitemap generator', () => {
  const cities: SitemapLocation[] = [
    { id: 0, slug: 'santiago' },
    { id: 3, slug: 'calama' }
  ];
  const communes: SitemapLocation[] = [
    { id: 1, slug: 'providencia' },
    { id: 2, slug: 'vitacura' }
  ];
  const profiles: SitemapProfile[] = [
    {
      iD_USUARIO: 10,
      nombrE_USUARIO: 'Activa',
      slug: 'Escort-Activa',
      ciudad: 0,
      comuna: 1,
      estado: 'V'
    },
    {
      iD_USUARIO: 11,
      nombrE_USUARIO: 'Inactiva',
      slug: 'Escort-Inactiva',
      ciudad: 3,
      comuna: 2,
      estado: 'N'
    }
  ];

  it('includes the canonical Home and excludes /home', () => {
    const xml = buildSitemapXml(profiles, communes, cities);
    expect(xml).toContain('<loc>https://paramours.cl/</loc>');
    expect(xml).not.toContain('https://paramours.cl/home');
  });

  it('includes active locations and excludes locations without active profiles', () => {
    const xml = buildSitemapXml(profiles, communes, cities);
    expect(xml).toContain('<loc>https://paramours.cl/escort-santiago</loc>');
    expect(xml).toContain('<loc>https://paramours.cl/escort-providencia</loc>');
    expect(xml).not.toContain('escort-calama');
    expect(xml).not.toContain('escort-vitacura');
  });

  it('includes active profiles and excludes inactive profiles', () => {
    const xml = buildSitemapXml(profiles, communes, cities);
    expect(xml).toContain('<loc>https://paramours.cl/profile/10/Escort-Activa</loc>');
    expect(xml).not.toContain('Escort-Inactiva');
  });

  it('does not duplicate normalized URLs', () => {
    const xml = buildSitemapXml([...profiles, profiles[0]], communes, cities);
    const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), match => match[1]);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('uses the standard namespace and never invents lastmod', () => {
    const xml = buildSitemapXml(profiles, communes, cities);
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).not.toContain('<lastmod>');
  });

  it('only emits canonical HTTPS non-www URLs', () => {
    const xml = buildSitemapXml(profiles, communes, cities);
    const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), match => match[1]);
    expect(urls.every(url => url.startsWith('https://paramours.cl/'))).toBeTrue();
    expect(urls.some(url => url.includes('www.'))).toBeFalse();
  });
});