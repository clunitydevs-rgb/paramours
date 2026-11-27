import { SimpleChange } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { Stories } from '../stories/stories';
import { ProfileTimeline } from '../profile-timeline/profile-timeline';

describe('Phase 1 dependent profile content', () => {
  function pendingApi() {
    const calls: { id: number; subscriber: Subscriber<any>; cancelled: boolean }[] = [];
    const request = ({ sUid }: any) => new Observable(subscriber => {
      const call = { id: sUid, subscriber, cancelled: false }; calls.push(call);
      return () => { call.cancelled = true; };
    });
    return { calls, request };
  }

  it('cancels old stories and cannot display their media after changing identity or destroying', () => {
    const { calls, request } = pendingApi();
    const component = new Stories({ getStoriesById: request } as any, { error: () => {} } as any, 'server' as unknown as object);
    component.iUser = 6; component.loadStories();
    component.iUser = 78; component.loadStories();
    expect(calls[0].cancelled).toBeTrue();
    calls[0].subscriber.next({ oStories: [{ iD_USUARIO: 6, fecha: new Date().toISOString() }] });
    expect(component.ArrStories).toEqual([]);
    calls[1].subscriber.next({ oStories: [{ iD_USUARIO: 78, fecha: new Date().toISOString() }] });
    expect(component.ArrStories[0].iD_USUARIO).toBe(78);
    component.ngOnDestroy(); expect(calls[1].cancelled).toBeTrue();
  });

  it('cancels old publication pages and clears the timeline for the new identity', () => {
    const { calls, request } = pendingApi();
    const component = new ProfileTimeline({} as any, { getPaginationPublicationsById: request } as any,
      {} as any, 'server', { error: () => {} } as any);
    component.iUser = 6; component.ngOnChanges({ iUser: new SimpleChange(null, 6, true) });
    component.iUser = 78; component.ngOnChanges({ iUser: new SimpleChange(6, 78, false) });
    expect(calls[0].cancelled).toBeTrue();
    calls[0].subscriber.next({ post: [{ iD_USUARIO: 6 }], totalPages: 1 });
    expect(component.ArraPublications).toEqual([]);
    calls[1].subscriber.next({ post: [{ iD_USUARIO: 78 }], totalPages: 1 });
    expect(component.ArraPublications[0].iD_USUARIO).toBe(78);
    component.ngOnDestroy(); expect(calls[1].cancelled).toBeTrue();
  });
});
