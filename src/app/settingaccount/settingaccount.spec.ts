import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Settingaccount } from './settingaccount';

describe('Settingaccount', () => {
  let component: Settingaccount;
  let fixture: ComponentFixture<Settingaccount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Settingaccount]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Settingaccount);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
