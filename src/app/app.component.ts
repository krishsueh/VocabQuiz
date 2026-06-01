import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavigationService } from './services/navigation.service';
import { SettingsComponent } from './pages/settings/settings.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SettingsComponent],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private navService = inject(NavigationService);

  settingsOpen = false;

  ngOnInit(): void {
    this.navService.openSettings$.subscribe(() => {
      this.settingsOpen = !this.settingsOpen;
    });
  }

  get isOnWords(): boolean {
    return this.router.url.startsWith('/words');
  }

  openSettings(): void {
    this.settingsOpen = !this.settingsOpen;
  }

  closeSettings(): void {
    this.settingsOpen = false;
  }

  goWordList(): void {
    this.settingsOpen = false;
    if (this.router.url.startsWith('/words')) {
      this.navService.goHome$.next();
    } else {
      this.router.navigate(['/words']);
    }
  }

  addWord(): void {
    this.settingsOpen = false;
    if (this.router.url.startsWith('/words')) {
      this.navService.openAdd$.next();
    } else {
      this.router.navigate(['/words']).then(() => {
        setTimeout(() => this.navService.openAdd$.next(), 50);
      });
    }
  }
}
