import { convertToParamMap } from '@angular/router';
import { of, Subject } from 'rxjs';
import { EscortDirectory } from './escort-directory';

describe('EscortDirectory location filtering', () => {
  const profiles = [
    { iD_USUARIO: 60, ciudad: 5, comuna: 0, metro: 5 },
    { iD_USUARIO: 68, ciudad: 0, comuna: 0, metro: 5 },
    { iD_USUARIO: 29, ciudad: '0', comuna: '0', metro: '1' },
    { iD_USUARIO: 70, ciudad: 0, comuna: 1, metro: 5 },
    { iD_USUARIO: 71, comuna: 0, metro: 5 }
  ];

  function createDirectory(slug: string, clients = profiles) {
    const params = new Subject<ReturnType<typeof convertToParamMap>>();
    const seo = jasmine.createSpyObj('seo', ['setLocationSeo']);
    const component = new EscortDirectory(
      { paramMap: params } as any,
      {
        getClients: () => of({ oClient: clients }),
        getCiudades: () => of([
          { id: 0, nombre: 'Santiago', slug: 'santiago' },
          { id: 5, nombre: 'Caldera', slug: 'caldera' }
        ]),
        getComunas: () => of([
          { id: '0', id_ciudad: '0', nombre: 'Las Condes', slug: 'las-condes' },
          { id: '1', id_ciudad: '0', nombre: 'Providencia', slug: 'providencia' }
        ]),
        getMetros: () => of([{ idComuna: '0', idMetro: '5', NombreMetro: 'Manquehue' }])
      } as any,
      seo,
      jasmine.createSpyObj('globalSeo', ['applyStaticRouteSeo']),
      jasmine.createSpyObj('ssr', ['setNotFound']),
      { tStoriesHome: { emit: jasmine.createSpy('emit') } } as any,
      'server' as unknown as object
    );
    component.ngOnInit();
    params.next(convertToParamMap({ slug }));
    return { component, params, seo };
  }

  it('excludes Caldera and missing cities from Las Condes while accepting numeric and string IDs', () => {
    const { component, seo } = createDirectory('las-condes');
    expect(component.profiles.map(profile => profile.iD_USUARIO)).toEqual([68, 29]);
    expect(seo.setLocationSeo).toHaveBeenCalledWith(jasmine.objectContaining({ profileCount: 2 }));
  });

  it('keeps Caldera profiles in Caldera regardless of their stale commune', () => {
    const { component } = createDirectory('caldera');
    expect(component.profiles.map(profile => profile.iD_USUARIO)).toEqual([60]);
  });

  it('requires both the parent city and commune for Manquehue', () => {
    const { component } = createDirectory('manquehue');
    expect(component.profiles.map(profile => profile.iD_USUARIO)).toEqual([68]);
  });

  it('updates the filters when navigating between city, commune and metro routes', () => {
    const { component, params } = createDirectory('caldera');
    for (const [slug, ids] of [
      ['las-condes', [68, 29]], ['manquehue', [68]], ['santiago', [68, 29, 70]], ['caldera', [60]]
    ] as const) {
      params.next(convertToParamMap({ slug }));
      expect(component.profiles.map(profile => profile.iD_USUARIO)).toEqual([...ids]);
    }
  });

  it('does not advertise Las Condes as active based only on a Caldera profile', () => {
    const { component } = createDirectory('las-condes', [profiles[0]]);
    expect(component.profiles).toEqual([]);
    expect(component.relatedLocations.some(location => location.url === '/escort-las-condes')).toBeFalse();
  });
});
