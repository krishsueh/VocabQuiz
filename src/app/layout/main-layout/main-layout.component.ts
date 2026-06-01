import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { Dialog } from '@angular/cdk/dialog';
import { DbService } from '../../services/db.service';
import { NavigationService } from '../../services/navigation.service';
import { Folder } from '../../models/folder.model';
import { FolderDeleteDialogComponent, FolderDeleteDialogData } from '../../shared/folder-delete-dialog/folder-delete-dialog.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet],
  templateUrl: './main-layout.component.html',
  host: { class: 'flex flex-1 overflow-hidden' },
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  folders: Folder[] = [];
  newFolderName = '';
  editingFolderId: number | null = null;
  editingFolderName = '';

  private subs = new Subscription();

  constructor(
    private db: DbService,
    private dialog: Dialog,
    private navService: NavigationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadFolders();
    this.subs.add(this.navService.foldersChanged$.subscribe(() => this.loadFolders()));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  async loadFolders(): Promise<void> {
    this.folders = await this.db.getAllFolders();
  }

  get activeWordView() { return this.navService.activeWordView(); }
  get isOnWords() { return this.router.url.startsWith('/words'); }
  get isOnQuiz() { return this.router.url.startsWith('/quiz'); }

  setWordView(view: 'all' | 'favorites' | number): void {
    this.navService.setWordView(view);
    if (!this.isOnWords) this.router.navigate(['/words']);
  }

  // Folder management
  async addFolder(): Promise<void> {
    const name = this.newFolderName.trim();
    if (!name) return;
    await this.db.addFolder(name);
    this.newFolderName = '';
    this.navService.foldersChanged$.next();
  }

  startEditFolder(folder: Folder): void {
    this.editingFolderId = folder.id!;
    this.editingFolderName = folder.name;
  }

  async saveFolder(): Promise<void> {
    const name = this.editingFolderName.trim();
    if (!name || this.editingFolderId == null) return;
    const folderId = this.editingFolderId;
    await this.db.updateFolder(folderId, name);
    this.editingFolderId = null;
    this.navService.foldersChanged$.next();
  }

  cancelEditFolder(): void {
    this.editingFolderId = null;
  }

  async confirmDeleteFolder(folder: Folder): Promise<void> {
    const wordCount = await this.db.getWordCountByFolder(folder.id!);

    if (wordCount === 0) {
      if (!confirm(`確定要刪除空資料夾「${folder.name}」嗎？`)) return;
      await this.db.deleteFolder(folder.id!);
      if (this.navService.activeWordView() === folder.id) {
        this.navService.setWordView('all');
      }
      this.navService.foldersChanged$.next();
    } else {
      const ref = this.dialog.open(FolderDeleteDialogComponent, {
        data: { folder, wordCount } satisfies FolderDeleteDialogData,
        panelClass: 'dialog-panel',
        hasBackdrop: true,
      });
      ref.closed.subscribe(async (result) => {
        if (!result) return;
        if ((result as string) === 'folder-only') {
          await this.db.deleteFolder(folder.id!);
        } else {
          await this.db.deleteWordsAndFolder(folder.id!);
        }
        if (this.navService.activeWordView() === folder.id) {
          this.navService.setWordView('all');
        }
        this.navService.foldersChanged$.next();
      });
    }
  }

  onNewFolderKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.addFolder();
  }

  onEditFolderKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.saveFolder();
    if (event.key === 'Escape') this.cancelEditFolder();
  }

  goToQuiz(): void {
    this.router.navigate(['/quiz']);
  }

  openSettings(): void {
    this.router.navigate(['/settings']);
  }
}
