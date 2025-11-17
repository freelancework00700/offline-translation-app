import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Injectable, signal } from '@angular/core';
import { Translation, Language as MLKitLanguage } from '@capacitor-mlkit/translation';
import { DownloadProgress, Language, OfflineSpeechRecognition, RecognitionResult } from 'capacitor-offline-speech-recognition';

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
  firstLanguage = signal<{ code: string; name: string } | null>(null);
  secondLanguage = signal<{ code: string; name: string } | null>(null);

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
          await this.router.navigateByUrl('/languages-download', { replaceUrl: true });
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
    } catch (error) {
      console.error('Error removing listeners:', error);
    }
  }

  savePreferences(pref: { first: any; second: any }) {
    this.firstLanguage.set(pref.first);
    this.secondLanguage.set(pref.second);

    localStorage.setItem('firstLanguage', JSON.stringify(pref.first));
    localStorage.setItem('secondLanguage', JSON.stringify(pref.second));
  }

  availableLanguages() {
    const downloaded = this.downloadedModels();
    return this.languages().filter((lang) => downloaded.includes(lang.code));
  }

  async loadPreferences() {
    const fetched = this.languages();
    if (!fetched || fetched.length === 0) return;

    const available = this.availableLanguages();
    const codes = available.length > 0 ? available.map((l) => l.code) : fetched.map((l) => l.code);

    // Load stored values
    const storedFirst = JSON.parse(localStorage.getItem('firstLanguage') || 'null');
    const storedSecond = JSON.parse(localStorage.getItem('secondLanguage') || 'null');

    // If stored preferences exist → load them
    if (storedFirst?.code && storedSecond?.code) {
      this.firstLanguage.set(storedFirst);
      this.secondLanguage.set(storedSecond);
      return;
    }

    // Auto-select defaults
    const first = available.find((l) => l.code === codes[0]);
    let second = available.find((l) => l.code === codes[1]);

    if (!second) second = first;

    const firstObj = { code: first?.code ?? '', name: first?.name ?? '' };
    const secondObj = { code: second?.code ?? '', name: second?.name ?? '' };

    // Save individually
    localStorage.setItem('firstLanguage', JSON.stringify(firstObj));
    localStorage.setItem('secondLanguage', JSON.stringify(secondObj));

    this.firstLanguage.set(firstObj);
    this.secondLanguage.set(secondObj);
  }

  async deleteLanguage(code: string) {
    try {
      const languageCode = code === 'en-us' ? 'en' : code;
      await Translation.deleteDownloadedModel({ language: languageCode as MLKitLanguage });
    } catch (error) {
      console.error('Error deleting language', code, error);
    }
  }
}
