import {
  IonApp,
  IonIcon,
  IonTabs,
  IonTitle,
  IonTabBar,
  IonHeader,
  IonContent,
  IonToolbar,
  IonTabButton,
  IonRouterOutlet
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { homeOutline, settingsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [IonApp, IonIcon, IonTabs, IonTitle, IonTabBar, IonHeader, IonToolbar, IonContent, IonTabButton, CommonModule, IonRouterOutlet]
})
export class AppComponent {
  constructor() {
    addIcons({ homeOutline, settingsOutline });
  }
}
