import { Injectable, signal } from '@angular/core';

export interface TranslationHistoryItem {
  id: string;
  fromText: string;
  toText: string;
  fromLang: string;
  toLang: string;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class TranslationHistoryService {
  history = signal<TranslationHistoryItem[]>([]);
  private storageKey = 'translationHistory';

  constructor() {
    this.loadHistory();
  }

  loadHistory() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      this.history.set(JSON.parse(stored));
    }
  }

  saveHistory(list: TranslationHistoryItem[]) {
    this.history.set(list);
    localStorage.setItem(this.storageKey, JSON.stringify(list));
  }

  addHistory(item: TranslationHistoryItem) {
    const updated = [item, ...this.history()];
    this.saveHistory(updated);
  }

  deleteHistory(id: string) {
    const newList = this.history().filter((item) => item.id !== id);
    this.saveHistory(newList);
  }

  clearHistory() {
    this.history.set([]);
    localStorage.removeItem(this.storageKey);
  }

  addOrUpdateHistory(entry: TranslationHistoryItem) {
    const history = [...this.history()]; // clone

    if (history.length === 0) {
      this.saveHistory([entry]);
      return;
    }
    const last = history[0];
    const oldText = last.fromText.trim();
    const newText = entry.fromText.trim();

    const isSameText = oldText === newText;
    const isTypingContinuation = newText.startsWith(oldText);
    const isRecent = entry.timestamp - last.timestamp < 3000;

    if ((isSameText || isTypingContinuation) && isRecent) {
      history[0] = entry;
    } else {
      history.unshift(entry);
    }

    this.saveHistory(history);
  }
}
