import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationSkipped, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { App } from './app';
import { MethodService } from './method/method.service';
import { AnalyticsService } from './service/analytics.service';
import { LoadingService } from './service/loading.service';
import { SeoService } from './service/seo.service';

describe('App navigation loading', () => {
  let events: Subject<any>;

  beforeEach(async () => {
    events = new Subject();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideAnimations(),
        { provide: Router, useValue: { events } },
        { provide: MethodService, useValue: { getItemLocalStorage: () => '' } },
        { provide: SeoService, useValue: { clearRouteSeo() {}, applyStaticRouteSeo() {} } },
        { provide: AnalyticsService, useValue: { trackPage() {} } }
      ]
    }).overrideComponent(App, { set: {
      template: '<ngx-spinner type="ball-scale-ripple-multiple"><p role="status">Cargando...</p></ngx-spinner>'
    } }).compileComponents();
  });

  it('shows the real spinner before route loading and keeps it until HTTP work finishes', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    events.next(new NavigationStart(1, '/settingaccount'));
    await new Promise(resolve => setTimeout(resolve, 20));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ngx-spinner-overlay')).not.toBeNull();
    const finishHttp = TestBed.inject(LoadingService).begin();
    events.next(new NavigationEnd(1, '/settingaccount', '/settingaccount'));
    await new Promise(resolve => setTimeout(resolve, 20));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ngx-spinner-overlay')).not.toBeNull();
    finishHttp();
    await new Promise(resolve => setTimeout(resolve, 20));
    fixture.detectChanges();
    await fixture.whenRenderingDone();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ngx-spinner-overlay')).toBeNull();
    fixture.destroy();
  });

  it('releases loading on cancelled, failed and skipped navigations', () => {
    const fixture = TestBed.createComponent(App);
    const loading = TestBed.inject(LoadingService);
    const start = spyOn(loading, 'startNavigation');
    const end = spyOn(loading, 'endNavigation');
    events.next(new NavigationStart(1, '/settingaccount'));
    events.next(new NavigationCancel(1, '/settingaccount', 'cancelled'));
    events.next(new NavigationStart(2, '/settingaccount'));
    events.next(new NavigationError(2, '/settingaccount', new Error('chunk failed')));
    events.next(new NavigationSkipped(3, '/profile', 'same URL'));
    expect(start.calls.allArgs()).toEqual([[1], [2]]);
    expect(end.calls.allArgs()).toEqual([[1], [2], [3]]);
    fixture.destroy();
  });
});
