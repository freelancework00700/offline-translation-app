import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguagesDownloadPage } from './languages-download.page';

describe('LanguagesDownloadPage', () => {
  let component: LanguagesDownloadPage;
  let fixture: ComponentFixture<LanguagesDownloadPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LanguagesDownloadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
