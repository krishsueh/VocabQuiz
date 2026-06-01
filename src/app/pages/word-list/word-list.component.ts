import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Dialog } from '@angular/cdk/dialog';
import { DbService } from '../../services/db.service';
import { NavigationService, DisplaySettings } from '../../services/navigation.service';
import { Word, CATEGORY_COLOR } from '../../models/word.model';
import { Folder } from '../../models/folder.model';
import { WordDialogComponent } from '../../shared/word-dialog/word-dialog.component';
import { FolderDeleteDialogComponent, FolderDeleteDialogData } from '../../shared/folder-delete-dialog/folder-delete-dialog.component';

type ViewType = 'all' | 'favorites' | number;

@Component({
  selector: 'app-word-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './word-list.component.html',
})
export class WordListComponent implements OnInit, OnDestroy {
  words: Word[] = [];
  folders: Folder[] = [];
  activeView: ViewType = 'all';

  viewMode: 'home' | 'list' = 'list';
  showNewFolderInput = false;
  folderEditMode = false;
  private _editModeJustEntered = false;
  private _longPressTimer: ReturnType<typeof setTimeout> | null = null;

  newFolderName = '';

  get displaySettings(): DisplaySettings {
    return this.navService.displaySettings();
  }

  private subs = new Subscription();

  constructor(
    private db: DbService,
    private dialog: Dialog,
    private navService: NavigationService,
  ) {}

  ngOnInit(): void {
    if (window.innerWidth < 1024) {
      this.viewMode = 'home';
    }
    this.subs.add(this.navService.goHome$.subscribe(() => { this.viewMode = 'home'; }));
    this.subs.add(this.navService.openAdd$.subscribe(() => { this.openAdd(); }));
    this.subs.add(this.navService.setWordView$.subscribe(view => {
      this.activeView = view as ViewType;
      this.viewMode = 'list';
      this.loadWords();
    }));
    this.subs.add(this.navService.foldersChanged$.subscribe(() => {
      this.db.getAllFolders().then(f => { this.folders = f; });
    }));
    this.load();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.cancelLongPress();
  }

  async load(): Promise<void> {
    this.folders = await this.db.getAllFolders();
    await this.loadWords();
  }

  async loadWords(): Promise<void> {
    if (this.activeView === 'all') {
      this.words = await this.db.getAllWords();
    } else if (this.activeView === 'favorites') {
      this.words = await this.db.getFavoriteWords();
    } else {
      this.words = await this.db.getWordsByFolder(this.activeView);
    }
  }

  selectSource(view: ViewType): void {
    this.folderEditMode = false;
    this.activeView = view;
    this.navService.activeWordView.set(view as 'all' | 'favorites' | number);
    this.viewMode = 'list';
    this.loadWords();
  }

  goHome(): void {
    this.viewMode = 'home';
  }

  // Long press for jiggle edit mode
  startLongPress(): void {
    if (this.folderEditMode) return;
    this._longPressTimer = setTimeout(() => { this.enterFolderEditMode(); }, 3000);
  }

  cancelLongPress(): void {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
  }

  enterFolderEditMode(): void {
    this.cancelLongPress();
    this.folderEditMode = true;
    this._editModeJustEntered = true;
    setTimeout(() => { this._editModeJustEntered = false; }, 300);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.folderEditMode && !this._editModeJustEntered) {
      this.folderEditMode = false;
    }
  }

  async onFolderDrop(event: CdkDragDrop<Folder[]>): Promise<void> {
    moveItemInArray(this.folders, event.previousIndex, event.currentIndex);
    await this.db.updateFolderOrders(this.folders);
    this.navService.foldersChanged$.next();
  }

  // Word operations
  openAdd(): void {
    const defaultFolderId = typeof this.activeView === 'number' ? this.activeView : null;
    const ref = this.dialog.open(WordDialogComponent, {
      data: { defaultFolderId },
      panelClass: 'dialog-panel',
      hasBackdrop: true,
    });
    // 新增單字不影響資料夾，只重載單字列表
    ref.closed.subscribe(() => this.loadWords());
  }

  openEdit(word: Word): void {
    const ref = this.dialog.open(WordDialogComponent, {
      data: { word },
      panelClass: 'dialog-panel',
      hasBackdrop: true,
    });
    // 編輯單字不影響資料夾，只重載單字列表
    ref.closed.subscribe(() => this.loadWords());
  }

  confirmDelete(word: Word): void {
    if (confirm(`確定要刪除「${word.korean}」嗎？`)) {
      // Optimistic: 立刻從畫面移除，背景刪除
      this.words = this.words.filter(w => w.id !== word.id);
      this.db.deleteWord(word.id!).catch(() => this.loadWords());
    }
  }

  toggleFavorite(word: Word): void {
    // Optimistic: 立刻更新畫面，背景寫入
    word.isFavorite = !word.isFavorite;
    this.db.toggleFavorite(word.id!, word.isFavorite).catch(() => {
      word.isFavorite = !word.isFavorite; // 失敗時還原
    });
  }

  // Mobile folder management
  async addFolder(): Promise<void> {
    const name = this.newFolderName.trim();
    if (!name) return;
    await this.db.addFolder(name);
    this.newFolderName = '';
    this.showNewFolderInput = false;
    this.folders = await this.db.getAllFolders();
    this.navService.foldersChanged$.next();
  }

  async confirmDeleteFolder(folder: Folder): Promise<void> {
    const wordCount = await this.db.getWordCountByFolder(folder.id!);

    if (wordCount === 0) {
      if (!confirm(`確定要刪除空資料夾「${folder.name}」嗎？`)) return;
      await this.db.deleteFolder(folder.id!);
      if (this.activeView === folder.id) {
        this.activeView = 'all';
        this.viewMode = 'home';
      }
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
        if (this.activeView === folder.id) {
          this.activeView = 'all';
          this.viewMode = 'home';
        }
        await this.load();
        this.navService.foldersChanged$.next();
      });
      return;
    }
    await this.load();
    this.navService.foldersChanged$.next();
  }

  readonly categoryColor = CATEGORY_COLOR;

  folderName(folderId: number | null): string {
    if (folderId == null) return '';
    return this.folders.find(f => f.id === folderId)?.name ?? '';
  }

  onNewFolderKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.addFolder();
    if (event.key === 'Escape') { this.showNewFolderInput = false; this.newFolderName = ''; }
  }
}
