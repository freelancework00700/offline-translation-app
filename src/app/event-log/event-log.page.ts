import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslationHistoryService } from 'src/services/translation-history-service';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonIcon, IonButton, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';

@Component({
  selector: 'app-event-log',
  templateUrl: './event-log.page.html',
  styleUrls: ['./event-log.page.scss'],
  standalone: true,
  imports: [IonLabel, IonItem, IonList, IonTitle, IonContent, IonHeader, IonToolbar, IonIcon, IonButton, IonButtons, RouterLink, DatePipe]
})
export class EventLogPage {
  constructor(public historyService: TranslationHistoryService) {}

  copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  deleteItem(id: string) {
    this.historyService.deleteHistory(id);
  }

  clearAll() {
    this.historyService.clearHistory();
  }
}
