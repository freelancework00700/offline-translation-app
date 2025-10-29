import { addIcons } from 'ionicons';
import { Component } from '@angular/core';
import * as ionicons from 'ionicons/icons';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [IonApp, IonRouterOutlet]
})
export class AppComponent {
  constructor() {
    addIcons({ ...ionicons });
  }
}
