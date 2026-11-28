import { profiles as oldProfiles, fixture as oldFixture } from './phase1-data.mjs';

export const profiles = oldProfiles.map(p => ({ ...p,
  descripcion: `<p>Atención individual de ${p.nombrE_USUARIO} en un espacio privado con contacto directo.</p>` }));
for (const [id, name, genero, ciudad, comuna, descripcion] of [
  [17, 'Klass SPA', 0, 0, 1, 'Masajes sensitivos en un espacio pensado para descansar con atención personalizada.'],
  [30, 'Mia', 0, 0, 1, 'Ofrezco masajes relajantes con reserva previa en mi espacio privado.'],
  [74, 'Barbie', 0, 0, 1, 'Atención independiente según los detalles publicados en mi perfil personal.'],
  [91, 'bb chanel', 0, 0, 1, 'Información personal y opciones declaradas de masajes con contacto directo.'],
  [93, 'Pamela', 1, 0, 1, ''],
  [68, 'Perfil con conflicto', 1, 0, 1, 'Tengo 41 años. Mi atención es independiente y personalizada con cita previa.'],
  [60, 'Perfil Caldera', 1, 5, 0, 'Atención independiente en Caldera según la descripción publicada por la anunciante.'],
  [61, 'Perfil Calama', 1, 3, 0, 'Perfil independiente en Calama con información publicada y contacto directo.']
]) profiles.push({ iD_USUARIO: id, nombrE_USUARIO: name, genero, ciudad, comuna,
  descripcion, edad: id === 68 ? 39 : 25, slug: `Escort-${name.replaceAll(' ', '-')}`, estado: 'V', tipo: '2', metro: 0 });
profiles.find(p => p.iD_USUARIO === 58).descripcion = null;
profiles.find(p => p.iD_USUARIO === 88).descripcion = '<p><br></p>';
profiles.find(p => p.iD_USUARIO === 78).descripcion = '<script>not descriptive</script><p>Atenci&oacute;n individual &amp; contacto directo con Favi. ' + 'Información adicional realmente declarada. '.repeat(30) + '</p>';

export function fixture(url, body = '', mode = 'ok') {
  const json = value => ({ status: 200, body: JSON.stringify(value) });
  if (mode !== 'ok') return oldFixture(url, body, mode);
  if (url.endsWith('/GetClients')) return json({ ncoderror: 0, oClient: profiles });
  if (url.endsWith('/ClientById')) {
    const p = profiles.find(p => p.iD_USUARIO === Number(JSON.parse(body).sUid));
    return json(p ? { ncoderror: 0, oClient: p } : { ncoderror: 1, oClient: null });
  }
  return oldFixture(url, body, mode);
}
