import {
  Translation,
  Language as MLKitLanguage,
} from '@capacitor-mlkit/translation';
import { Router } from '@angular/router';
import {
  DownloadProgress,
  Language,
  OfflineSpeechRecognition,
  RecognitionResult,
} from 'capacitor-offline-speech-recognition';
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
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

  constructor(private router: Router) {}

  async getSupportedLanguages() {
    try {
      const response: any =
        await OfflineSpeechRecognition.getSupportedLanguages();
      const pluginLanguages = Array.isArray(response)
        ? response
        : response.languages;

      const langs: Language[] = pluginLanguages.map((lang: any) => ({
        code: lang.code,
        name: lang.name,
        modelName: lang.modelName || `model-${lang.code}`,
      }));

      this.languages.set(langs);
    } catch (error) {
      console.error('Error fetching supported languages:', error);
    }
  }

  async getDownloadedLanguageModels() {
    try {
      const response =
        await OfflineSpeechRecognition.getDownloadedLanguageModels();
      const models = (response.models || []).map(
        (m: any) => m.language || m.code
      );
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

      this.downloadListener = await OfflineSpeechRecognition.addListener(
        'downloadProgress',
        (progress: DownloadProgress) => {
          this.downloadProgress.update((p) => ({
            ...p,
            [language]: progress.progress,
          }));
        }
      );

      const result = await OfflineSpeechRecognition.downloadLanguageModel({
        language,
      });

      if (this.downloadListener) {
        await this.downloadListener.remove();
        this.downloadListener = undefined;
      }

      await this.getDownloadedLanguageModels();

      this.downloadProgress.update((p) => {
        const { [language]: _, ...rest } = p;
        return rest;
      });

      try {
        await this.downloadMLKitModel(language as any);
      } catch (mlkitError) {
        console.error(
          `Error downloading MLKit model (${language}):`,
          mlkitError
        );
      }
    } catch (error) {
      console.error(`Error downloading language model (${language}):`, error);
      this.downloadProgress.update((p) => {
        const { [language]: _, ...rest } = p;
        return rest;
      });
    }
  }

  async downloadMLKitModel(language: string) {
    try {
      const languageCode = language === 'en-us' ? 'en' : language;
      await Translation.downloadModel({
        language: languageCode as MLKitLanguage,
      });
    } catch (error) {
      console.error(`Error downloading MLKit model (${language}):`, error);
    }
  }

  async startRecognition(language = 'en-us') {
    try {
      this.isStartingRecognition.set(true);
      if (this.isRecognizing()) {
        console.warn(
          'Recognition is already in progress. Stopping and restarting...'
        );
        await this.stopRecognition(); 
      }

      this.recognizedText.set('');
      this.isRecognizing.set(true);

      this.recognitionListener = await OfflineSpeechRecognition.addListener(
        'recognitionResult',
        (result: RecognitionResult) => {
          console.log(`Recognized: ${result.text} (Final: ${result.isFinal})`);

          this.recognizedText.update((prev) => {
            if (result.isFinal) {
              return prev ? `${prev} ${result.text}` : result.text;
            } else {
              // For intermediate updates (optional behavior)
              return `${prev}\n${result.text}`.trim();
            }
          });
        }
      );

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
