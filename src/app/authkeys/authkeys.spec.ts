import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Authkeys } from './authkeys';

describe('Authkeys', () => {
  let component: Authkeys;
  let fixture: ComponentFixture<Authkeys>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Authkeys]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Authkeys);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
