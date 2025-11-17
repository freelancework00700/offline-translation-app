import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguagesPreferencePage } from './languages-preference.page';

describe('LanguagesPreferencePage', () => {
  let component: LanguagesPreferencePage;
  let fixture: ComponentFixture<LanguagesPreferencePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LanguagesPreferencePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
