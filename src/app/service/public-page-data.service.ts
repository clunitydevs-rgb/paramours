import { isPlatformServer } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { catchError, defer, map, Observable, of, tap, timeout } from 'rxjs';
import { ApiServices } from '../api/api.service';
import { Cliente } from '../models/models.interface';
import { ProfileRequestContext } from '../models/profile-request-context';
import { classifyProfile, ProfileLookup, publicCatalog } from '../models/public-page-data';

@Injectable({ providedIn: 'root' })
export class PublicPageDataService {
  private readonly api = inject(ApiServices);
  private readonly state = inject(TransferState);
  private readonly server = isPlatformServer(inject(PLATFORM_ID));

  catalog(): Observable<Cliente[] | null> {
    return this.transferred('catalog', () => this.api.getClients().pipe(
      timeout(6000), map(publicCatalog), catchError(() => of(null))
    ));
  }

  profile(id: number, context: unknown, refreshOwner = false): Observable<ProfileLookup> {
    if (!this.server && refreshOwner) this.state.remove(makeStateKey(`public-page:profile:${id}`));
    return this.transferred(`profile:${id}`, () => {
      const lookup = (context as ProfileRequestContext | null)?.profileLookup;
      if (this.server && lookup?.requestedId === id) {
        return of(lookup.unavailable ? { kind: 'unavailable' } as const : classifyProfile(lookup.response, id));
      }
      return this.api.getClientById({ sUid: id }).pipe(
        timeout(6000), map(payload => classifyProfile(payload, id)),
        catchError((error: HttpErrorResponse) => of<ProfileLookup>({ kind: error.status === 404 ? 'missing' : 'unavailable' }))
      );
    }, value => {
      if (value.kind !== 'found' || value.profile.estado === 'V') return value;
      const { iD_USUARIO, nombrE_USUARIO, estado } = value.profile;
      return { kind: 'found', profile: { iD_USUARIO, nombrE_USUARIO, estado,
        slug: (value.profile as Cliente & { slug?: string }).slug } as unknown as Cliente };
    });
  }

  private transferred<T>(name: string, request: () => Observable<T>, serialize: (value: T) => T = value => value): Observable<T> {
    return defer(() => {
      const key = makeStateKey<T | null>(`public-page:${name}`);
      if (!this.server && this.state.hasKey(key)) {
        const value = this.state.get(key, null) as T;
        this.state.remove(key);
        return of(value);
      }
      return request().pipe(tap(value => { if (this.server) this.state.set(key, serialize(value)); }));
    });
  }
}
