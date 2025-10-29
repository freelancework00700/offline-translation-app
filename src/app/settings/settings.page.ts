import { addIcons } from 'ionicons';
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Language } from 'capacitor-offline-speech-recognition';
import { checkmarkCircle, cloudDownloadOutline } from 'ionicons/icons';
import { OfflineSpeechRecognitionService } from 'src/services/offline-speech-recognition';
import { IonIcon, IonList, IonItem, IonLabel, IonButton, IonSpinner, IonContent } from '@ionic/angular/standalone';
@Component({
  selector: 'app-settings',
  styleUrls: ['./settings.page.scss'],
  templateUrl: './settings.page.html',
  imports: [IonIcon, IonItem, IonList, IonLabel, IonButton, IonSpinner, IonContent, CommonModule]
})
export class SettingsPage implements OnInit {
  isDownloading = signal<boolean>(false);
  languages = this.speechService.languages;
  downloadedModels = this.speechService.downloadedModels;
  downloadProgress = this.speechService.downloadProgress;
  constructor(private speechService: OfflineSpeechRecognitionService) {
    addIcons({ checkmarkCircle, cloudDownloadOutline });
  }

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
    if (this.isDownloaded(lang.code)) return;
    this.isDownloading.set(true);
    try {
      await this.speechService.downloadLanguageModel(lang.code);
    } catch (error) {
      console.error(`Error downloading language model for ${lang.code}:`, error);
    } finally {
      this.isDownloading.set(false);
    }
  }
}
