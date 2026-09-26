import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { ApiServices } from '../api/api.service';
import { MethodService } from '../method/method.service';
import { ToastService } from '../service/toast.service';
import { AnalyticsService } from '../service/analytics.service';
import { Settingaccount } from './settingaccount';

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
        template: '<form [formGroup]="frmAccount"><ejs-richtexteditor formControlName="descripcion"></ejs-richtexteditor></form>'
      }
    }).compileComponents();
    fixture = TestBed.createComponent(Settingaccount);
    component = fixture.componentInstance;
    spyOn(component, 'LoadProfile');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('saves current editor content and survives storage and repeated editing', async () => {
    const html = '<p><strong>Descripci\u00f3n \u{1F600} \u2764\uFE0F \u{1F970} \u{1F469}\u{1F3FD}\u200D\u{1F4BB}</strong> &amp; texto</p>';
    component.frmAccount.controls.descripcion.setValue(html);
    fixture.detectChanges();
    await fixture.whenStable();
    component.descriptionEditor!.dataBind();
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
    component.descriptionEditor!.dataBind();
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
});
