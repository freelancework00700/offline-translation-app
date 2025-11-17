import {
  IonIcon,
  IonCard,
  IonTitle,
  IonHeader,
  IonSelect,
  IonButton,
  IonToolbar,
  IonContent,
  IonTextarea,
  IonCardTitle,
  IonCardHeader,
  IonCardContent,
  IonSelectOption
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, switchMap, of } from 'rxjs';
import { Language } from 'capacitor-offline-speech-recognition';
import { TextToSpeechService } from 'src/services/text-to-speech';
import { Component, computed, effect, signal } from '@angular/core';
import { Translation, Language as MLKitLanguage } from '@capacitor-mlkit/translation';
import { TranslationHistoryService } from 'src/services/translation-history-service';
import { OfflineSpeechRecognitionService } from 'src/services/offline-speech-recognition';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonIcon,
    IonCard,
    IonTitle,
    IonHeader,
    IonButton,
    IonSelect,
    IonToolbar,
    IonContent,
    IonTextarea,
    FormsModule,
    IonCardTitle,
    IonCardHeader,
    IonCardContent,
    IonSelectOption
  ]
})
export class HomePage {
  inputTextTop = signal('');
  inputTextBottom = signal('');
  languages = signal<Language[]>([]);
  selectedTopLanguage = signal<string>('');
  selectedBottomLanguage = signal<string>('');
  activeRecordingSide = signal<null | 'top' | 'bottom'>(null);

  availableLanguages = computed<Language[]>(() => {
    const all = this.languages();
    const downloaded = this.osrService.downloadedModels();
    if (!all || all.length === 0) return [];
    const downloadedSet = new Set(downloaded.map((c) => this.normalizeLangCode(c).toLowerCase()));
    return all.filter((l) => downloadedSet.has(this.normalizeLangCode(l.code).toLowerCase()));
  });

  rawTitleTopToBottom = computed(() => {
    const src = this.getLanguageName(this.selectedTopLanguage());
    const dst = this.getLanguageName(this.selectedBottomLanguage());
    return `${src} to ${dst}`;
  });

  rawTitleBottomToTop = computed(() => {
    const src = this.getLanguageName(this.selectedBottomLanguage());
    const dst = this.getLanguageName(this.selectedTopLanguage());
    return `${src} to ${dst}`;
  });

  titleTopToBottom = signal('');
  titleBottomToTop = signal('');

  isRecording = computed(() => this.osrService.isRecognizing());
  isStartingRecognition = computed(() => this.osrService.isStartingRecognition());
  isRecordingTop = computed(() => this.isRecording() && this.activeRecordingSide() === 'top');
  isRecordingBottom = computed(() => this.isRecording() && this.activeRecordingSide() === 'bottom');
  topTextSubject = new Subject<string>();
  bottomTextSubject = new Subject<string>();

  constructor(
    private ttsService: TextToSpeechService,
    private historyService: TranslationHistoryService,
    private osrService: OfflineSpeechRecognitionService,
  ) {
    this.topTextSubject
      .pipe(
        debounceTime(300),
        switchMap((text) => {
          if (!text.trim()) {
            return of('');
          }
          return this.translate(text, 'top');
        })
      )
      .subscribe({
        next: (translated) => {
          this.inputTextBottom.set(translated);
        },
        error: (err) => {
          console.error('Top→Bottom translation failed', err);
          this.inputTextBottom.set('');
        }
      });

    this.bottomTextSubject
      .pipe(
        debounceTime(300),
        switchMap((text) => {
          if (!text.trim()) {
            return of('');
          }
          return this.translate(text, 'bottom');
        })
      )
      .subscribe({
        next: (translated) => {
          this.inputTextTop.set(translated);
        },
        error: (err) => {
          console.error('Bottom→Top translation failed', err);
          this.inputTextTop.set('');
        }
      });
    effect(() => {
      const first = this.osrService.firstLanguage();
      const second = this.osrService.secondLanguage();

      if (first?.code) {
        this.selectedBottomLanguage.set(first.code);
      }
      if (second?.code) {
        this.selectedTopLanguage.set(second.code);
      }
    });
    effect(() => {
      const topLang = this.selectedTopLanguage();
      const bottomLang = this.selectedBottomLanguage();

      if (!topLang || !bottomLang) return;

      // Recompute raw titles
      const rawTopToBottom = this.rawTitleTopToBottom();
      const rawBottomToTop = this.rawTitleBottomToTop();
      this.titleTopToBottom.set(rawTopToBottom);
      this.titleBottomToTop.set(rawBottomToTop);

      this.updateTranslatedTitles(rawTopToBottom, rawBottomToTop, topLang, bottomLang);
    });

    effect(() => {
      const active = this.activeRecordingSide();
      const text = this.osrService.recognizedText();
      const isRecognizing = this.osrService.isRecognizing();
      if (!active || !isRecognizing) {
        return;
      }

      this.onTextChange(text, active);
    });
  }

  async updateTranslatedTitles(rawTopToBottom: string, rawBottomToTop: string, topLang: string, bottomLang: string) {
    try {
      const topCode = this.normalizeLangCode(topLang);
      const bottomCode = this.normalizeLangCode(bottomLang);

      const [t1, t2] = await Promise.all([this.translateText(rawTopToBottom, topCode), this.translateText(rawBottomToTop, bottomCode)]);

      this.titleTopToBottom.set(t1);
      this.titleBottomToTop.set(t2);
    } catch (err) {
      console.error('Title translation error:', err);
      this.titleTopToBottom.set(rawTopToBottom);
      this.titleBottomToTop.set(rawBottomToTop);
    }
  }

  async translateText(text: string, targetLang: string): Promise<string> {
    try {
      const normalizedTarget = this.normalizeLangCode(targetLang);

      const result = await Translation.translate({
        text,
        sourceLanguage: 'en' as MLKitLanguage,
        targetLanguage: normalizedTarget as MLKitLanguage
      });
      return result.text;
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    }
  }

  async ngOnInit() {
    try {
      await this.osrService.getSupportedLanguages();
      await this.osrService.getDownloadedLanguageModels();
      await this.osrService.loadPreferences();
      const fetched = this.osrService.languages();

      if (fetched && fetched.length > 0) {
        this.languages.set(fetched);
      }
    } catch (err) {
      console.error('Error loading languages', err);
    }
  }

  onTextChange(newText: string, side: 'top' | 'bottom') {
    if (side === 'top') {
      this.inputTextTop.set(newText);
      this.topTextSubject.next(newText);
    } else if (side === 'bottom') {
      this.inputTextBottom.set(newText);
      this.bottomTextSubject.next(newText);
    }
  }

  async translate(text: string, side: 'top' | 'bottom') {
    try {
      const source = this.normalizeLangCode(side === 'top' ? this.selectedTopLanguage() : this.selectedBottomLanguage());
      const target = this.normalizeLangCode(side === 'top' ? this.selectedBottomLanguage() : this.selectedTopLanguage());

      const result = await Translation.translate({
        text,
        sourceLanguage: source as MLKitLanguage,
        targetLanguage: target as MLKitLanguage
      });

      // Convert code → full language names
      const sourceName = this.getLanguageName(source);
      const targetName = this.getLanguageName(target);

      this.historyService.addOrUpdateHistory({
        id: crypto.randomUUID(),
        fromText: text,
        toText: result.text,
        fromLang: sourceName,
        toLang: targetName,
        timestamp: Date.now()
      });

      return result.text;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('An error occurred while translating. Please try again later.');
    }
  }

  onMicClick(side: 'top' | 'bottom') {
    const text = side === 'top' ? this.inputTextTop() : this.inputTextBottom();
    const lang = side === 'top' ? this.selectedTopLanguage() : this.selectedBottomLanguage();
    if (text.trim()) {
      this.ttsService.speakText(text, lang);
    }
  }

  async onRecord(side: 'top' | 'bottom') {
    this.activeRecordingSide.set(side);
    const lang = side === 'top' ? this.selectedTopLanguage() : this.selectedBottomLanguage();
    await this.osrService.startRecognition(lang);
  }

  async startRecord(side: 'top' | 'bottom') {
    await this.onRecord(side);
  }

  async stopRecord() {
    if (this.osrService.isRecognizing()) {
      await this.osrService.stopRecognition();
      this.activeRecordingSide.set(null);
    }
  }

  onLanguageChange(code: string, side: 'top' | 'bottom') {
    if (side === 'top') {
      const previous = this.selectedTopLanguage();
      this.selectedTopLanguage.set(code);
      const text = this.inputTextTop();
      if (text.trim()) {
        this.translateInPlace(text, previous, code).then((translated) => this.inputTextTop.set(translated));
      }
    } else if (side === 'bottom') {
      const previous = this.selectedBottomLanguage();
      this.selectedBottomLanguage.set(code);
      const text = this.inputTextBottom();
      if (text.trim()) {
        this.translateInPlace(text, previous, code).then((translated) => this.inputTextBottom.set(translated));
      }
    }
  }

  async translateInPlace(text: string, fromCode: string, toCode: string): Promise<string> {
    const source = this.normalizeLangCode(fromCode) as MLKitLanguage;
    const target = this.normalizeLangCode(toCode) as MLKitLanguage;
    const result = await Translation.translate({
      text,
      sourceLanguage: source,
      targetLanguage: target
    });
    return result.text;
  }

  //helper functions
  normalizeLangCode(code: string): string {
    return code.includes('-') ? code.split('-')[0] : code;
  }

  getLanguageName(code: string): string {
    const found = this.languages().find((l) => this.normalizeLangCode(l.code).toLowerCase() === this.normalizeLangCode(code).toLowerCase());
    return found ? found.name : code;
  }
}
