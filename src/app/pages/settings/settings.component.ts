import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService, DisplaySettings } from '../../services/navigation.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private navService = inject(NavigationService);

  get settings(): DisplaySettings {
    return this.navService.displaySettings();
  }

  setPrimaryLang(lang: 'korean' | 'chinese'): void {
    this.navService.updateDisplaySettings({ ...this.settings, primaryLang: lang });
  }

  toggleShowSecondary(): void {
    this.navService.updateDisplaySettings({ ...this.settings, showSecondary: !this.settings.showSecondary });
  }
}
