import {
  IonList,
  IonItem,
  IonSelectOption,
  IonButton,
  IonLabel,
  IonSelect,
  IonHeader,
  IonContent,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonIcon
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Component, computed, effect, OnInit, signal } from '@angular/core';
import { OfflineSpeechRecognitionService } from 'src/services/offline-speech-recognition';

interface Language {
  code: string;
  name: string;
}

@Component({
  selector: 'app-languages-preference',
  templateUrl: './languages-preference.page.html',
  styleUrls: ['./languages-preference.page.scss'],
  imports: [
    IonIcon,
    IonButtons,
    IonTitle,
    IonToolbar,
    IonContent,
    IonHeader,
    IonLabel,
    IonItem,
    IonList,
    IonSelectOption,
    IonSelect,
    CommonModule,
    FormsModule,
    RouterLink
  ]
})
export class LanguagesPreferencePage implements OnInit {
  languages = signal<Language[]>([]);
  language1 = '';
  language2 = '';
  availableLanguages = computed<Language[]>(() => {
    const all = this.languages();
    const downloaded = this.osrService.downloadedModels();

    if (!all || all.length === 0) return [];

    const downloadedSet = new Set(downloaded.map((c) => this.normalizeLangCode(c).toLowerCase()));

    return all.filter((l) => downloadedSet.has(this.normalizeLangCode(l.code).toLowerCase()));
  });
  constructor(
    private router: Router,
    private osrService: OfflineSpeechRecognitionService,
  ) {
    effect(() => {
      const p = this.osrService.firstLanguage();
      const s = this.osrService.secondLanguage();

      this.language1 = p?.code ?? '';
      this.language2 = s?.code ?? '';
    });
  }

  async ngOnInit() {
    await this.loadLanguages();
  }

  async loadLanguages() {
    const fetched = this.osrService.languages();
    if (fetched?.length > 0) {
      this.languages.set(fetched);
    }
  }

  // Save whenever any dropdown changes
  onPreferenceChange() {
    if (!this.language1 || !this.language2) return;

    const first = this.languages().find((l) => l.code === this.language1);
    const second = this.languages().find((l) => l.code === this.language2);

    if (!first || !second) return;

    this.osrService.savePreferences({ first, second });
  }

  normalizeLangCode(code: string): string {
    return code.includes('-') ? code.split('-')[0] : code;
  }
}
