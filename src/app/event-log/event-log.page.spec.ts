import { EventLogPage } from './event-log.page';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('EventLogPage', () => {
  let component: EventLogPage;
  let fixture: ComponentFixture<EventLogPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EventLogPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
