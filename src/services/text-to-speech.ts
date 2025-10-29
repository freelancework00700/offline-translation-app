import { Injectable } from '@angular/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

@Injectable({ providedIn: 'root' })
export class TextToSpeechService {
  async speakText(text: string, lang: string) {
    try {
      await TextToSpeech.speak({ text, lang });
    } catch (err) {
      console.error('Text-to-speech error', err);
    }
  }
}
