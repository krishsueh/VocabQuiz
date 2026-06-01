import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface DisplaySettings {
  primaryLang: 'korean' | 'chinese';
  showSecondary: boolean;
}

const DISPLAY_KEY = 'kvq-display';

function readDisplaySettings(): DisplaySettings {
  try {
    const raw = localStorage.getItem(DISPLAY_KEY);
    if (raw) {
      const p = JSON.parse(raw) as DisplaySettings;
      if (p.primaryLang === 'korean' || p.primaryLang === 'chinese') {
        return {
          primaryLang: p.primaryLang,
          showSecondary: typeof p.showSecondary === 'boolean' ? p.showSecondary : true,
        };
      }
    }
  } catch {}
  return { primaryLang: 'korean', showSecondary: true };
}

@Injectable({ providedIn: 'root' })
export class NavigationService {
  goHome$ = new Subject<void>();
  openAdd$ = new Subject<void>();
  openSettings$ = new Subject<void>();
  setWordView$ = new Subject<'all' | 'favorites' | number>();
  foldersChanged$ = new Subject<void>();

  readonly activeWordView = signal<'all' | 'favorites' | number>('all');

  setWordView(view: 'all' | 'favorites' | number): void {
    this.activeWordView.set(view);
    this.setWordView$.next(view);
  }

  readonly displaySettings = signal<DisplaySettings>(readDisplaySettings());

  updateDisplaySettings(settings: DisplaySettings): void {
    this.displaySettings.set(settings);
    localStorage.setItem(DISPLAY_KEY, JSON.stringify(settings));
  }
}
