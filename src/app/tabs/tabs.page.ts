import { Component } from '@angular/core';
import { IonTabs, IonIcon, IonTabBar, IonTabButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonIcon, IonTabs, IonTabBar, IonTabButton]
})
export class TabsPage {
  constructor() {}
}
