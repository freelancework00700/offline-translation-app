import {
  IonApp,
  IonRouterOutlet,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonTabs,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { homeOutline, settingsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    IonTabs,
    IonApp,
    IonRouterOutlet,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonTabBar,
    IonTabButton,
    IonIcon,
    CommonModule,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor() {
    addIcons({ homeOutline, settingsOutline });
  }
}
