import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Language } from 'capacitor-offline-speech-recognition';
import { Component, OnInit, signal, computed } from '@angular/core';
import { OfflineSpeechRecognitionService } from 'src/services/offline-speech-recognition';
import {
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonSpinner,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-languages-download',
  templateUrl: './languages-download.page.html',
  styleUrls: ['./languages-download.page.scss'],
  imports: [
    IonButtons,
    IonIcon,
    IonItem,
    IonList,
    IonLabel,
    IonButton,
    IonSpinner,
    IonContent,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    RouterLink
  ]
})
export class LanguagesDownloadPage implements OnInit {
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

  constructor(
    private alertController: AlertController,
    private speechService: OfflineSpeechRecognitionService
  ) {}

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

  async confirmDelete(lang: any) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete ${lang.name} language?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => {
            this.deleteLanguage(lang.code);
          }
        }
      ]
    });

    await alert.present();
  }

  deleteLanguage(code: string) {
    this.speechService.deleteLanguage(code);
  }
}
