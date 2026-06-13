import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Storieshome } from './storieshome';

describe('Storieshome', () => {
  let component: Storieshome;
  let fixture: ComponentFixture<Storieshome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Storieshome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Storieshome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
