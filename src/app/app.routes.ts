import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'words', pathMatch: 'full' },
      {
        path: 'words',
        loadComponent: () =>
          import('./pages/word-list/word-list.component').then(m => m.WordListComponent),
      },
      {
        path: 'quiz',
        loadComponent: () =>
          import('./pages/quiz/quiz.component').then(m => m.QuizComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.component').then(m => m.SettingsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'words' },
];
