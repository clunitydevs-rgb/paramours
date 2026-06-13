import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileTimeline } from './profile-timeline';

describe('ProfileTimeline', () => {
  let component: ProfileTimeline;
  let fixture: ComponentFixture<ProfileTimeline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileTimeline]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileTimeline);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
