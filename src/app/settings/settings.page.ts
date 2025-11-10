import { DecimalPipe } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { Language } from 'capacitor-offline-speech-recognition';
import { OfflineSpeechRecognitionService } from 'src/services/offline-speech-recognition';
import { IonIcon, IonList, IonItem, IonLabel, IonButton, IonSpinner, IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-settings',
  styleUrls: ['./settings.page.scss'],
  templateUrl: './settings.page.html',
  imports: [IonIcon, IonItem, IonList, IonLabel, IonButton, IonSpinner, IonContent, DecimalPipe, IonHeader, IonToolbar, IonTitle]
})
export class SettingsPage implements OnInit {
  //  reactive states
  isDownloading = signal<boolean>(false);
  isDownloadingMap = signal<Record<string, boolean>>({});

  // from service
  languages = this.speechService.languages;
  downloadedModels = this.speechService.downloadedModels;
  downloadProgress = this.speechService.downloadProgress;
  mlkitDownloading = this.speechService.mlkitDownloading;

  //  computed flag: true when any download is in progress
  anyDownloading = computed(() => {
    return (
      Object.keys(this.downloadProgress()).length > 0 ||
      Object.keys(this.mlkitDownloading()).length > 0 ||
      Object.keys(this.isDownloadingMap()).length > 0
    );
  });

  constructor(private speechService: OfflineSpeechRecognitionService) {}

  async ngOnInit() {
    await this.loadLanguages();
  }

  async loadLanguages() {
    try {
      await this.speechService.getSupportedLanguages();
      await this.speechService.getDownloadedLanguageModels();
    } catch (err) {
      console.error('Error loading languages:', err);
    }
  }

  isDownloaded(langCode: string): boolean {
    return this.downloadedModels().includes(langCode);
  }

  async downloadModel(lang: Language) {
    const code = lang.code;
    if (this.isDownloaded(code)) return;

    //  prevent double clicks or parallel downloads
    if (this.isDownloadingMap()[code] || this.mlkitDownloading()[code] || this.anyDownloading()) return;

    this.isDownloadingMap.update((m) => ({ ...m, [code]: true }));
    this.isDownloading.set(true);

    try {
      await this.speechService.downloadLanguageModel(code);
    } catch (error) {
      console.error(`Error downloading ${code}:`, error);
    } finally {
      //  cleanup per-language state
      this.isDownloadingMap.update((m) => {
        const { [code]: _, ...rest } = m;
        return rest;
      });
      this.mlkitDownloading.update((p) => {
        const { [code]: _, ...rest } = p;
        return rest;
      });
      this.downloadProgress.update((p) => {
        const { [code]: _, ...rest } = p;
        return rest;
      });

      //  if no more downloads left, clear global flag
      const stillDownloading = Object.keys(this.isDownloadingMap()).length > 0;
      this.isDownloading.set(stillDownloading);
    }
  }
}
