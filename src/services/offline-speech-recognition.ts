import { Router } from '@angular/router';
import { Injectable, signal } from '@angular/core';
import { Translation, Language as MLKitLanguage } from '@capacitor-mlkit/translation';
import { DownloadProgress, Language, OfflineSpeechRecognition, RecognitionResult } from 'capacitor-offline-speech-recognition';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class OfflineSpeechRecognitionService {
  languages = signal<Language[]>([]);
  recognizedText = signal<string>('');
  isRecognizing = signal<boolean>(false);
  downloadedModels = signal<string[]>([]);
  downloadListener?: { remove: () => void };
  isStartingRecognition = signal<boolean>(false);
  recognitionListener?: { remove: () => void };
  downloadProgress = signal<Record<string, number>>({});
  mlkitDownloading = signal<{ [key: string]: boolean }>({});

  constructor(private router: Router) {}

  async getSupportedLanguages() {
    try {
      const response: any = await OfflineSpeechRecognition.getSupportedLanguages();
      const pluginLanguages = Array.isArray(response) ? response : response.languages;

      const langs: Language[] = pluginLanguages.map((lang: any) => ({
        code: lang.code,
        name: lang.name,
        modelName: lang.modelName || `model-${lang.code}`
      }));

      this.languages.set(langs);
    } catch (error) {
      console.error('Error fetching supported languages:', error);
    }
  }

  async getDownloadedLanguageModels() {
    try {
      const response = await OfflineSpeechRecognition.getDownloadedLanguageModels();
      const models = (response.models || []).map((m: any) => m.language || m.code);
      this.downloadedModels.set(models);
      console.log('Downloaded models:', models);
      if (!models || models.length === 0) {
        try {
          await this.router.navigateByUrl('/settings', { replaceUrl: true });
        } catch {}
      }
    } catch (error) {
      console.error('Error fetching downloaded models:', error);
    }
  }

  async downloadLanguageModel(language: string) {
    try {
      this.downloadProgress.update((p) => ({ ...p, [language]: 0 }));
      this.mlkitDownloading.update((p) => ({ ...p, [language]: true }));

      //  Clean old listener if exists
      if (this.downloadListener) {
        await this.downloadListener.remove();
        this.downloadListener = undefined;
      }

      //  Progress listener
      this.downloadListener = await OfflineSpeechRecognition.addListener('downloadProgress', (progress: DownloadProgress) => {
        this.downloadProgress.update((p) => ({
          ...p,
          [language]: progress.progress
        }));
      });

      //  Run both model downloads in parallel
      await Promise.all([OfflineSpeechRecognition.downloadLanguageModel({ language }), this.downloadMLKitModel(language)]);

      //  After completion
      await this.getDownloadedLanguageModels();
    } catch (error) {
      console.error(`Error downloading ${language}:`, error);
      throw error;
    } finally {
      //  Always cleanup
      this.downloadProgress.update((p) => {
        const { [language]: _, ...rest } = p;
        return rest;
      });
      this.mlkitDownloading.update((p) => {
        const { [language]: _, ...rest } = p;
        return rest;
      });
      if (this.downloadListener) {
        await this.downloadListener.remove();
        this.downloadListener = undefined;
      }
    }
  }

  async downloadMLKitModel(language: string) {
    try {
      const languageCode = language === 'en-us' ? 'en' : language;
      if (languageCode === 'en' && Capacitor.getPlatform() === 'ios') {
        return;
      }
      await Translation.downloadModel({
        language: languageCode as MLKitLanguage
      });
    } catch (error) {
      console.error(`Error downloading MLKit model (${language}):`, error);
    }
  }

  async startRecognition(language = 'en-us') {
    try {
      this.isStartingRecognition.set(true);
      if (this.isRecognizing()) {
        await this.stopRecognition();
      }

      this.recognizedText.set('');
      this.isRecognizing.set(true);

      let permanentText = '';
      let tempText = '';

      this.recognitionListener = await OfflineSpeechRecognition.addListener('recognitionResult', (result: RecognitionResult) => {
        if (result.isFinal) {
          permanentText = permanentText ? `${permanentText.trim()} ${result.text.trim()}` : result.text.trim();
          tempText = '';

          this.recognizedText.set(permanentText.trim());
        } else {
          tempText = result.text.trim();
          this.recognizedText.set(`${permanentText.trim()} ${tempText}`.trim());
        }
      });
      await OfflineSpeechRecognition.startRecognition({ language });
      this.isStartingRecognition.set(false);
      console.log(`Started speech recognition for language: ${language}`);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.isRecognizing.set(false);
    }
  }

  async stopRecognition() {
    try {
      await OfflineSpeechRecognition.stopRecognition();
      await this.removeAllListeners();
      console.log('Speech recognition stopped.');
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    } finally {
      this.isRecognizing.set(false);

      if (this.recognitionListener) {
        await this.recognitionListener.remove();
        this.recognitionListener = undefined;
      }
    }
  }

  async removeAllListeners() {
    try {
      await OfflineSpeechRecognition.removeAllListeners();
      console.log('All listeners removed.');
    } catch (error) {
      console.error('Error removing listeners:', error);
    }
  }
}
