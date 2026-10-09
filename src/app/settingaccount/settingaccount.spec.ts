import { ComponentFixture, DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, of, Subject } from 'rxjs';
import { ApiServices } from '../api/api.service';
import { MethodService } from '../method/method.service';
import { ToastService } from '../service/toast.service';
import { AnalyticsService } from '../service/analytics.service';
import { Settingaccount } from './settingaccount';
import { LoadingService } from '../service/loading.service';

describe('Settingaccount description persistence', () => {
  let component: Settingaccount;
  let fixture: ComponentFixture<Settingaccount>;
  let api: jasmine.SpyObj<ApiServices>;

  beforeEach(async () => {
    api = jasmine.createSpyObj('ApiServices', ['updateClient']);
    api.updateClient.and.returnValue(of({ ncoderror: '0' } as any));
    await TestBed.configureTestingModule({
      imports: [Settingaccount],
      providers: [
        { provide: ApiServices, useValue: api },
        { provide: ActivatedRoute, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: MethodService, useValue: { getItemLocalStorage: () => '', tInProcess: EMPTY } },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
        { provide: AnalyticsService, useValue: jasmine.createSpyObj('AnalyticsService', ['trackEvent']) }
      ]
    }).overrideComponent(Settingaccount, {
      set: {
        template: '<form [formGroup]="frmAccount"><app-profile-description-editor #descriptionEditor [control]="frmAccount.controls.descripcion"></app-profile-description-editor></form>'
      }
    }).compileComponents();
    fixture = TestBed.createComponent(Settingaccount);
    component = fixture.componentInstance;
    component.isProfileReady = true;
    spyOn(component, 'LoadProfile');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('saves current editor content and survives storage and repeated editing', async () => {
    const html = '<p><strong>Descripci\u00f3n \u{1F600} \u2764\uFE0F \u{1F970} \u{1F469}\u{1F3FD}\u200D\u{1F4BB}</strong> &amp; texto</p>';
    component.frmAccount.controls.descripcion.setValue(html);
    fixture.detectChanges();
    await fixture.whenStable();
    component.descriptionEditor!.editor!.dataBind();
    // Simulate submission before the form receives the editor change event.
    component.frmAccount.controls.descripcion.setValue('<p>Anterior</p>', { emitModelToViewChange: false });
    component.goBtnAceptar();
    const stored = api.updateClient.calls.mostRecent().args[0].descripcion;
    expect(stored).toContain('&#128512;');
    expect(stored).not.toMatch(/[^\x00-\x7F]/);
    const rendered = document.createElement('div');
    rendered.innerHTML = stored;
    const original = document.createElement('div');
    original.innerHTML = html;
    expect(rendered.textContent).toBe(original.textContent);
    expect(rendered.querySelector('strong')).not.toBeNull();

    component.frmAccount.controls.descripcion.setValue(stored);
    fixture.detectChanges();
    await fixture.whenStable();
    component.descriptionEditor!.editor!.dataBind();
    component.goBtnAceptar();
    expect(api.updateClient.calls.mostRecent().args[0].descripcion).toBe(stored);
  });

  it('allows clearing the description', () => {
    component.frmAccount.controls.descripcion.setValue('');
    component.goBtnAceptar();
    const rendered = document.createElement('div');
    rendered.innerHTML = api.updateClient.calls.mostRecent().args[0].descripcion;
    expect(rendered.textContent).toBe('');
  });

  it('preserves the stored description when saving before the deferred editor loads', () => {
    component.descriptionEditor = undefined;
    const html = '<p>Mi descripción &#128512;</p>';
    component.frmAccount.controls.descripcion.setValue(html);
    component.goBtnAceptar();
    const rendered = document.createElement('div');
    rendered.innerHTML = api.updateClient.calls.mostRecent().args[0].descripcion;
    expect(rendered.textContent).toBe('Mi descripción 😀');
  });
});

describe('Settingaccount deferred editor and initial loading', () => {
  let fixture: ComponentFixture<Settingaccount>;
  let api: jasmine.SpyObj<ApiServices>;
  let finishLoading: jasmine.Spy;

  beforeEach(async () => {
    api = jasmine.createSpyObj('ApiServices', [
      'updateClient', 'getClientByToken', 'getNaciones', 'getGeneros', 'getColorOjos',
      'getColorCabello', 'getBiotipo', 'getCiudades', 'getComunas', 'getMetros', 'getMediaFiles'
    ]);
    for (const method of ['getNaciones', 'getGeneros', 'getColorOjos', 'getColorCabello',
      'getBiotipo', 'getCiudades', 'getComunas', 'getMetros'] as const) {
      api[method].and.returnValue(of([]));
    }
    api.updateClient.and.returnValue(of({ ncoderror: '0' } as any));
    api.getMediaFiles.and.returnValue(EMPTY);
    finishLoading = jasmine.createSpy('finishLoading');
    await TestBed.configureTestingModule({
      imports: [Settingaccount],
      deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [
        { provide: ApiServices, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: MethodService, useValue: { getItemLocalStorage: () => '1', tInProcess: EMPTY, tMediaFiles: EMPTY } },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
        { provide: AnalyticsService, useValue: { trackEvent() {} } },
        { provide: LoadingService, useValue: { begin: () => finishLoading } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(Settingaccount);
  });

  afterEach(() => fixture.destroy());

  it('renders the form before the editor and preserves the description across deferred loading', async () => {
    const component = fixture.componentInstance;
    spyOn(component, 'LoadProfile');
    component.isProfileReady = true;
    component.frmAccount.controls.descripcion.setValue('<p>Descripción 😀</p>');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.save-top')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ejs-richtexteditor')).toBeNull();
    component.goBtnAceptar();
    expect(api.updateClient.calls.mostRecent().args[0].descripcion).toContain('&#128512;');
    const [block] = await fixture.getDeferBlocks();
    await block.render(DeferBlockState.Complete);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.descriptionEditor?.getHtml()).toContain('Descripción');
    component.goBtnAceptar();
    expect(api.updateClient.calls.mostRecent().args[0].descripcion).toContain('&#128512;');
  });

  it('keeps loading after the API returns until the catalogs populate the form', () => {
    const cliente = new Subject<any>();
    const ciudades = new Subject<any>();
    api.getClientByToken.and.returnValue(cliente);
    api.getCiudades.and.returnValue(ciudades);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    cliente.next({ ncoderror: '0', oClient: { ...component.oCliente, iD_USUARIO: 1, correo: 'user@example.test' } });
    cliente.complete();
    expect(finishLoading).not.toHaveBeenCalled();
    expect(component.isProfileReady).toBeFalse();
    component.goBtnAceptar();
    expect(api.updateClient).not.toHaveBeenCalled();
    ciudades.next([]);
    ciudades.complete();
    expect(component.frmAccount.controls.email.value).toBe('user@example.test');
    expect(component.isProfileReady).toBeTrue();
    expect(finishLoading).toHaveBeenCalledTimes(1);
  });

  it('releases loading when the user leaves before the initial data arrives', () => {
    api.getClientByToken.and.returnValue(new Subject());
    fixture.detectChanges();
    expect(finishLoading).not.toHaveBeenCalled();
    fixture.destroy();
    expect(finishLoading).toHaveBeenCalledTimes(1);
  });

  it('releases loading and prevents saving when initial loading fails', () => {
    const cliente = new Subject<any>();
    api.getClientByToken.and.returnValue(cliente);
    fixture.detectChanges();
    cliente.error({ status: 500 });
    expect(finishLoading).toHaveBeenCalledTimes(1);
    fixture.componentInstance.goBtnAceptar();
    expect(api.updateClient).not.toHaveBeenCalled();
  });
});
