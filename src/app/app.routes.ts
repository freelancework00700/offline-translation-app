import { Routes } from '@angular/router';
import { TabsPage } from './tabs/tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings.page').then((m) => m.SettingsPage)
      },
      {
        path: 'languages-preference',
        loadComponent: () => import('./languages-preference/languages-preference.page').then( m => m.LanguagesPreferencePage)
      },
      {
        path: 'event-log',
        loadComponent: () => import('./event-log/event-log.page').then( m => m.EventLogPage)
      },
      {
        path: 'languages-download',
        loadComponent: () => import('./languages-download/languages-download.page').then( m => m.LanguagesDownloadPage)
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
];
