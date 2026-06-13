import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoryManager } from './story-manager';

describe('StoryManager', () => {
  let component: StoryManager;
  let fixture: ComponentFixture<StoryManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoryManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoryManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
