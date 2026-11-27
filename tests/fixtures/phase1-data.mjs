export const profiles = [
  [6, 'Fran', 1], [78, 'Favi', 1], [58, 'Agatha', 1], [25, 'Gemma', 0], [88, 'Sofi', 0],
  [15, 'Elida Morat', 1], [16, 'Perfil Dos', 1]
].map(([id, name, category]) => ({ iD_USUARIO: id, nombrE_USUARIO: name, slug: `Escort-${name.replaceAll(' ', '-')}`,
  estado: 'V', tipo: '2', genero: category, descripcion: `Public description ${name}`, edad: 25,
  ciudad: 0, comuna: 1, metro: 0, fotO_PERFIL: `${id}.jpg`,
  correo: 'SECRET_EMAIL', fechA_NACIMIENTO: 'SECRET_BIRTH', token: 'SECRET_TOKEN',
  refreshToken: 'SECRET_REFRESH', privateNested: { secret: 'SECRET_NESTED' } }));

export function fixture(url, body = '', mode = 'ok') {
  const json = value => ({ status: 200, body: JSON.stringify(value) });
  const critical = /\/(GetClients|ClientById)$/.test(url);
  if (critical && mode === 'invalid') return { status: 200, body: '{invalid json' };
  if (critical && ['500', '503'].includes(mode)) return { status: Number(mode), body: '' };
  if (critical && mode === 'functional') return json({ ncoderror: -1, oClient: null });
  if (url.endsWith('/GetClients')) return json({ ncoderror: 0, oClient: mode === 'empty' ? [] : profiles });
  if (url.endsWith('/ClientById')) {
    const id = Number(JSON.parse(body).sUid);
    const p = profiles.find(p => p.iD_USUARIO === id);
    return json(p ? { ncoderror: 0, oClient: mode === 'mismatch' ? profiles.find(p => p.iD_USUARIO !== id) : p }
      : { ncoderror: 1, oClient: null });
  }
  if (url.endsWith('/GetBlogs')) return json({ ncoderror: 0, oBlog: [] });
  if (url.includes('/Blog/')) return json({ ncoderror: 1, oBlog: null });
  if (url.includes('/GetCountReviewByUser')) return json(0);
  if (url.includes('/GetValReviewById')) return json({ oValReview: { valoracion: '0' } });
  if (url.includes('/File/')) return json({ oMediaFiles: [], ncoderror: '0' });
  if (url.includes('/Publications/')) return json({ post: [], pageIndex: 1, totalPages: 0 });
  if (url.includes('/Stories/')) return json({ oStories: [], ncoderror: '0' });
  return json({ ncoderror: 0 });
}
