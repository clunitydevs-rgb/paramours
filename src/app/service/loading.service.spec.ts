import { HttpRequest } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject, throwError } from 'rxjs';
import { ApiInterceptor } from '../interceptor/api.interceptor';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let loading: LoadingService;
  let spinner: jasmine.SpyObj<NgxSpinnerService>;

  beforeEach(() => {
    spinner = jasmine.createSpyObj('NgxSpinnerService', ['show', 'hide']);
    TestBed.configureTestingModule({ providers: [
      { provide: NgxSpinnerService, useValue: spinner },
      { provide: PLATFORM_ID, useValue: 'browser' }
    ] });
    loading = TestBed.inject(LoadingService);
  });

  it('keeps loading through route activation until all concurrent requests finish', () => {
    loading.startNavigation(1);
    const first = loading.begin();
    const second = loading.begin();
    expect(spinner.show).toHaveBeenCalledTimes(1);
    loading.endNavigation(1);
    first();
    expect(spinner.hide).not.toHaveBeenCalled();
    second();
    expect(spinner.hide).toHaveBeenCalledTimes(1);
    first();
    loading.endNavigation(1);
    expect(spinner.hide).toHaveBeenCalledTimes(1);
  });

  it('does not let a cancelled navigation hide its replacement', () => {
    loading.startNavigation(1);
    loading.startNavigation(2);
    loading.endNavigation(1);
    expect(spinner.hide).not.toHaveBeenCalled();
    loading.endNavigation(2);
    expect(spinner.hide).toHaveBeenCalledTimes(1);
  });

  it('counts HTTP subscriptions independently and releases cancellations and errors', () => {
    const interceptor = new ApiInterceptor(loading);
    const response = new Subject<any>();
    const request = new HttpRequest('GET', '/api/profile');
    const pending = interceptor.intercept(request, { handle: () => response });
    expect(spinner.show).not.toHaveBeenCalled();
    const first = pending.subscribe();
    const second = pending.subscribe();
    first.unsubscribe();
    expect(spinner.hide).not.toHaveBeenCalled();
    second.unsubscribe();
    expect(spinner.hide).toHaveBeenCalledTimes(1);
    interceptor.intercept(request, { handle: () => throwError(() => new Error('network')) })
      .subscribe({ error: () => {} });
    expect(spinner.hide).toHaveBeenCalledTimes(2);
    interceptor.intercept(request, { handle: () => { throw new Error('handler'); } })
      .subscribe({ error: () => {} });
    expect(spinner.hide).toHaveBeenCalledTimes(3);
  });

  it('keeps background catalog requests out of the global loader', () => {
    const response = new Subject<any>();
    const subscription = new ApiInterceptor(loading)
      .intercept(new HttpRequest('GET', '/assets/data/ciudades.json'), { handle: () => response })
      .subscribe();
    expect(spinner.show).not.toHaveBeenCalled();
    subscription.unsubscribe();
    expect(spinner.hide).not.toHaveBeenCalled();
  });

  it('does not render a browser overlay during SSR', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [
      { provide: NgxSpinnerService, useValue: spinner },
      { provide: PLATFORM_ID, useValue: 'server' }
    ] });
    TestBed.inject(LoadingService).begin()();
    expect(spinner.show).not.toHaveBeenCalled();
    expect(spinner.hide).not.toHaveBeenCalled();
  });
});
