import { RouterLink } from '@angular/router';
import { Component, signal } from '@angular/core';
import {  IonList, IonItem, IonLabel, IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-settings',
  styleUrls: ['./settings.page.scss'],
  templateUrl: './settings.page.html',
  imports: [ IonItem, IonList, IonLabel, IonContent, IonHeader, IonToolbar, IonTitle,RouterLink]
})
export class SettingsPage {
}
