import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Identitycheck } from './identitycheck';

describe('Identitycheck', () => {
  let component: Identitycheck;
  let fixture: ComponentFixture<Identitycheck>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Identitycheck]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Identitycheck);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
