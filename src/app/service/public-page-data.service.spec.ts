import { PLATFORM_ID, TransferState } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import { ApiServices } from '../api/api.service';
import { PublicPageDataService } from './public-page-data.service';

describe('Public page data: transfer, errors and identity', () => {
  const profile = { iD_USUARIO: 6, nombrE_USUARIO: 'Fran', slug: 'Escort-Fran', estado: 'V',
    descripcion: 'Public description', ciudad: 0, comuna: 1, correo: 'PRIVATE_EMAIL',
    token: 'PRIVATE_TOKEN', fechA_NACIMIENTO: 'PRIVATE_BIRTH_DATE' };
  function setup(platform = 'server') {
    const api = { getClientById: jasmine.createSpy().and.returnValue(of({ ncoderror: '0', oClient: profile })),
      getClients: jasmine.createSpy().and.returnValue(of({ ncoderror: '0', oClient: [profile] })) };
    TestBed.configureTestingModule({ providers: [
      { provide: ApiServices, useValue: api }, { provide: PLATFORM_ID, useValue: platform }
    ] });
    return { api, service: TestBed.inject(PublicPageDataService), state: TestBed.inject(TransferState) };
  }
  it('transfers only allowlisted public fields, excluding nested objects and private API fields', () => {
    const { service, state } = setup();
    service.profile(6, null).subscribe(); service.catalog().subscribe();
    const json = state.toJson();
    expect(json).toContain('Public description'); expect(json).not.toContain('PRIVATE_');
    expect(json).not.toContain('correo'); expect(json).not.toContain('fechA_NACIMIENTO');
  });
  it('does not expose inactive profile details in transfer state', () => {
    const { api, service, state } = setup();
    api.getClientById.and.returnValue(of({ ncoderror: '0', oClient: { ...profile, estado: 'N' } }));
    service.profile(6, null).subscribe();
    expect(state.toJson()).toContain('Escort-Fran'); expect(state.toJson()).not.toContain('Public description');
  });
  it('reuses an unavailable Express preflight without issuing another API request', () => {
    const { api, service } = setup(); let result: any;
    service.profile(6, { profileLookup: { requestedId: 6, unavailable: true } }).subscribe(value => result = value);
    expect(result.kind).toBe('unavailable'); expect(api.getClientById).not.toHaveBeenCalled();
  });
  it('does not reuse another request identity', () => {
    const { api, service } = setup(); service.profile(6, { profileLookup: { requestedId: 78, unavailable: true } }).subscribe();
    expect(api.getClientById).toHaveBeenCalledOnceWith({ sUid: 6 });
  });
  it('consumes initial browser transfer data once and then refreshes on a later request', () => {
    const { api, service, state } = setup('browser');
    state.set('public-page:profile:6' as any, { kind: 'found', profile });
    service.profile(6, null).subscribe(); expect(api.getClientById).not.toHaveBeenCalled();
    service.profile(6, null).subscribe(); expect(api.getClientById).toHaveBeenCalledTimes(1);
  });

  it('does not transfer profile-only details in a public catalog', () => {
    const { api, service, state } = setup();
    api.getClients.and.returnValue(of({ ncoderror: '0', oClient: [{ ...profile, celular: 'PUBLIC_PHONE' }] }));
    service.catalog().subscribe();
    const json = state.toJson();
    expect(json).toContain('Escort-Fran');
    expect(json).not.toContain('Public description');
    expect(json).not.toContain('PUBLIC_PHONE');
    expect(json).not.toContain('PRIVATE_');
  });
  for (const value of [null, {}, { ncoderror: '0', oClient: { ...profile, iD_USUARIO: 78 } },
    { ncoderror: '-1', oClient: null }, { ncoderror: '0', oClient: null }]) {
    it(`treats invalid/mismatched payload as unavailable: ${JSON.stringify(value)}`, () => {
      const { api, service } = setup(); api.getClientById.and.returnValue(of(value)); let result: any;
      service.profile(6, null).subscribe(value => result = value); expect(result.kind).toBe('unavailable');
    });
  }
  for (const status of [0, 500, 503]) it(`classifies HTTP ${status} as unavailable`, () => {
    const { api, service } = setup(); api.getClientById.and.returnValue(throwError(() => ({ status })));
    service.profile(6, null).subscribe(value => expect(value.kind).toBe('unavailable'));
  });
  it('classifies only explicit absence as missing', () => {
    const { api, service } = setup(); api.getClientById.and.returnValue(of({ ncoderror: '1', oClient: null }));
    service.profile(6, null).subscribe(value => expect(value.kind).toBe('missing'));
    api.getClientById.and.returnValue(throwError(() => ({ status: 404 })));
    service.profile(6, null).subscribe(value => expect(value.kind).toBe('missing'));
  });
  it('times out an essential pending profile without falsely reporting missing', fakeAsync(() => {
    const { api, service } = setup(); api.getClientById.and.returnValue(NEVER); let result: any;
    service.profile(6, null).subscribe(value => result = value);
    tick(6000); expect(result.kind).toBe('unavailable');
  }));
  for (const value of [{ ncoderror: '0', oClient: {} }, { ncoderror: '-1', oClient: [] }]) {
    it('does not turn an invalid catalog into an empty success', () => {
      const { api, service } = setup(); api.getClients.and.returnValue(of(value));
      service.catalog().subscribe(value => expect(value).toBeNull());
    });
  }
});
