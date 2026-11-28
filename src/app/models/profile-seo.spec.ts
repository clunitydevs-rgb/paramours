import { Cliente } from './models.interface';
import { buildProfileSeo, emptyProfileLocation, profileCategory, publicDescriptionText, resolveProfileLocation } from './profile-seo';

describe('Phase 2 public profile SEO', () => {
  const cities = [{ id: 0, nombre: 'Santiago', slug: 'santiago' },
    { id: 5, nombre: 'Caldera', slug: 'caldera' }, { id: 3, nombre: 'Calama', slug: 'calama' }];
  const communes = [{ id: 1, id_ciudad: 0, nombre: 'Providencia', slug: 'providencia' },
    { id: 5, id_ciudad: 0, nombre: 'Santiago Centro', slug: 'santiago-centro' },
    { id: 0, id_ciudad: 0, nombre: 'Las Condes', slug: 'las-condes' }];
  const profile = (values: Partial<Cliente> = {}) => ({ iD_USUARIO: 6, nombrE_USUARIO: 'Fran',
    genero: '1', ciudad: 0, comuna: 1, descripcion: 'Recibo en mi departamento con atención personalizada y contacto directo.',
    ...values } as Cliente);
  const seo = (p = profile()) => buildProfileSeo(p, resolveProfileLocation(p, cities, communes), document);

  it('extracts an individual summary from the published description without mutating it', () => {
    const p = profile(); const original = JSON.stringify(p); const result = seo(p);
    expect(result.descriptionSource).toBe('published');
    expect(result.description).toContain(p.descripcion);
    expect(result.description).toContain('Fran, escort en Providencia, Santiago.');
    expect(JSON.stringify(p)).toBe(original);
  });
  for (const value of ['', null, undefined, '<p><br></p>', ' \n\t ', '<script>claim()</script>', 'Hola']) {
    it(`uses only verified context for empty/unusable text ${String(value)}`, () => {
      const result = seo(profile({ descripcion: value as string }));
      expect(result.descriptionSource).toBe('fallback');
      expect(result.description).toBe('Fran, escort en Providencia, Santiago.');
      expect(result.description).not.toMatch(/disponibilidad|verificad|VIP|25 años/);
    });
  }
  it('removes HTML, scripts, styles and hidden non-content containers', () => {
    const text = publicDescriptionText('<p>Atención <b>personalizada</b>.</p><script>alert("bad")</script>' +
      '<style>body{display:none}</style><iframe>bad iframe</iframe><svg>bad svg</svg><p>Contacto directo.</p>', document);
    expect(text).toBe('Atención personalizada. Contacto directo.');
    expect(text).not.toMatch(/bad|alert|display|<|>/);
  });
  it('decodes Spanish, numeric and named HTML entities identically without interpreting markup', () => {
    expect(publicDescriptionText('Cari&ntilde;osa&nbsp; &amp; atenci&#243;n &#x1F642; &quot;directa&quot;', document))
      .toBe('Cariñosa & atención 🙂 "directa"');
    expect(publicDescriptionText('&lt;script&gt;bad()&lt;/script&gt; Texto real del perfil', document)).toBe('Texto real del perfil');
  });
  it('does not mistake quoted tag attributes or URLs for descriptive content', () => {
    const text = publicDescriptionText('<img title="> not text" src="https://not-requested.test/x">Texto real y atención independiente. https://example.test/contacto contacto@example.test', document);
    expect(text).toBe('Texto real y atención independiente.');
  });
  it('prefers complete published sentences over a character cut', () => {
    const result = seo(profile({ descripcion: 'Mi atención es independiente y personalizada. ' + 'Un texto descriptivo mucho más extenso con palabras completas. '.repeat(20) }));
    expect(result.description.length).toBeLessThan(240);
    expect(result.description).toContain('Mi atención es independiente y personalizada.');
    expect(result.description).not.toMatch(/\.\.\.$/);
  });
  it('marks a long sentence extract with an ellipsis and keeps whole words', () => {
    const result = seo(profile({ descripcion: 'Atención independiente con información descriptiva real y opciones declaradas '.repeat(30) }));
    expect(result.description.endsWith('…')).toBeTrue();
    expect(result.description).not.toMatch(/(?: con| de| y)…$/);
    expect(result.description.length).toBeLessThan(240);
  });
  it('does not slice a pathological unbroken token into an invented word', () => {
    expect(seo(profile({ descripcion: 'x'.repeat(1000) + ' otras palabras del perfil' })).descriptionSource).toBe('fallback');
  });
  it('prefers a complete clause when the following invitation would be cut midway', () => {
    const published = 'Atención personalizada en un espacio independiente y tranquilo, ven y conoce todas las opciones realmente declaradas en esta descripción '.repeat(8);
    const result = seo(profile({ descripcion: published }));
    expect(result.description).toBe('Fran, escort en Providencia, Santiago. Atención personalizada en un espacio independiente y tranquilo…');
  });
  it('resolves category from the current profile, including numeric and string values', () => {
    expect(profileCategory(0).singular).toBe('Masajista');
    expect(profileCategory('0').plural).toBe('Masajistas');
    expect(profileCategory(1).singular).toBe('Escort');
    expect(profileCategory(null).singular).toBe('Perfil');
    expect(seo(profile({ genero: '0' })).title).toBe('Fran - Masajista en Providencia, Santiago | Paramours');
    expect(seo(profile({ genero: '0' })).heading).toBe('Fran, Masajista en Providencia, Santiago');
  });
  for (const city of cities.slice(1)) {
    it(`keeps ${city.nombre} a city, not a commune of Santiago`, () => {
      const p = profile({ ciudad: city.id, comuna: 0 }); const result = seo(p);
      expect(result.title).toBe(`Fran - Escort en ${city.nombre} | Paramours`);
      expect(result.description).not.toContain('Santiago');
      expect(resolveProfileLocation(p, cities, communes).commune).toBe('');
    });
  }
  for (const commune of communes) {
    it(`resolves the actual parent city of ${commune.nombre}`, () => {
      const location = resolveProfileLocation(profile({ comuna: commune.id }), cities, communes);
      expect(location.label).toBe(`${commune.nombre}, Santiago`);
      expect(location.directoryUrl).toBe(`/escort-${commune.slug}`);
    });
  }
  it('can resolve another city parent without hard-coded Santiago rules', () => {
    const location = resolveProfileLocation(profile({ ciudad: 3, comuna: 77 }), cities,
      [{ id: 77, id_ciudad: 3, nombre: 'Sector de prueba', slug: 'sector-prueba' }]);
    expect(location.label).toBe('Sector de prueba, Calama');
  });
  it('does not attach a mismatching or unproven commune to a city', () => {
    expect(resolveProfileLocation(profile(), cities, [{ id: 1, nombre: 'Sin padre' }]).label).toBe('Santiago');
    expect(resolveProfileLocation(profile({ ciudad: 999 }), cities, communes).label).toBe('');
    expect(buildProfileSeo(profile(), emptyProfileLocation(), document).title).toBe('Fran - Escort | Paramours');
  });
  it('distinguishes similar names using their actual descriptions', () => {
    const a = seo(profile({ nombrE_USUARIO: 'Fran', descripcion: 'Atención independiente en un departamento privado según lo publicado.' }));
    const b = seo(profile({ nombrE_USUARIO: 'Francisca', descripcion: 'Masajes relajantes con cita previa según mi descripción publicada.' }));
    expect(a.description).not.toBe(b.description);
    expect(a.description).not.toContain('Masajes');
    expect(b.description).not.toContain('departamento');
  });
  it('omits a conflicting self-declared age without choosing an age or changing the original', () => {
    const p = profile({ edad: 39, descripcion: '“Tengo 41 años y una atención individual. Soy independiente y recibo con cita previa.”' });
    const original = p.descripcion; const result = seo(p);
    expect(result.description).not.toMatch(/39|41/);
    expect(result.description).toContain('Soy independiente y recibo con cita previa.');
    expect(result.descriptionWarnings).toEqual(['age-conflict']);
    expect(p.descripcion).toBe(original);
  });
  it('does not invent or suppress a declared age when the structured value agrees', () => {
    const result = seo(profile({ edad: 41, descripcion: 'Tengo 41 años y una atención independiente con cita previa.' }));
    expect(result.description).toContain('Tengo 41 años');
    expect(result.descriptionWarnings).toEqual([]);
  });
});
