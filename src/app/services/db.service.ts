import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Word } from '../models/word.model';
import { Folder } from '../models/folder.model';

@Injectable({ providedIn: 'root' })
export class DbService extends Dexie {
  words!: Table<Word, number>;
  folders!: Table<Folder, number>;

  constructor() {
    super('koreanVocabDB');
    this.version(1).stores({
      words: '++id, korean, chinese, createdAt',
    });
    this.version(2).stores({
      words: '++id, korean, chinese, folderId, isFavorite, createdAt',
      folders: '++id, name, createdAt',
    }).upgrade(tx =>
      tx.table('words').toCollection().modify((word: any) => {
        word.folderId = null;
        word.isFavorite = false;
        delete word.tags;
      })
    );
    this.version(3).stores({
      words: '++id, korean, chinese, folderId, isFavorite, category, createdAt',
      folders: '++id, name, createdAt',
    }).upgrade(tx =>
      tx.table('words').toCollection().modify((word: any) => {
        word.category = null;
      })
    );
    this.version(4).stores({
      words: '++id, korean, chinese, folderId, isFavorite, category, createdAt',
      folders: '++id, name, sortOrder, createdAt',
    }).upgrade(tx =>
      tx.table('folders').toCollection().modify((folder: any) => {
        folder.sortOrder = folder.id ?? 0;
      })
    );
  }

  // Word CRUD
  addWord(word: Omit<Word, 'id'>): Promise<number> {
    return this.words.add(word as Word);
  }

  updateWord(id: number, changes: Partial<Word>): Promise<void> {
    return this.words.update(id, changes).then(() => {});
  }

  deleteWord(id: number): Promise<void> {
    return this.words.delete(id);
  }

  getAllWords(): Promise<Word[]> {
    return this.words.orderBy('korean').toArray();
  }

  getWordsByFolder(folderId: number): Promise<Word[]> {
    return this.words.where('folderId').equals(folderId).sortBy('korean');
  }

  getFavoriteWords(): Promise<Word[]> {
    return this.words.filter(w => w.isFavorite).sortBy('korean');
  }

  toggleFavorite(id: number, isFavorite: boolean): Promise<void> {
    return this.words.update(id, { isFavorite }).then(() => {});
  }

  // Folder CRUD
  async addFolder(name: string): Promise<number> {
    const last = await this.folders.orderBy('sortOrder').last();
    const sortOrder = last ? (last.sortOrder ?? 0) + 1 : 0;
    return this.folders.add({ name, sortOrder, createdAt: new Date() });
  }

  updateFolder(id: number, name: string): Promise<void> {
    return this.folders.update(id, { name }).then(() => {});
  }

  getWordCountByFolder(folderId: number): Promise<number> {
    return this.words.where('folderId').equals(folderId).count();
  }

  deleteFolder(id: number): Promise<void> {
    return this.transaction('rw', this.words, this.folders, async () => {
      await this.words.where('folderId').equals(id).modify({ folderId: null });
      await this.folders.delete(id);
    });
  }

  deleteWordsAndFolder(id: number): Promise<void> {
    return this.transaction('rw', this.words, this.folders, async () => {
      await this.words.where('folderId').equals(id).delete();
      await this.folders.delete(id);
    });
  }

  getAllFolders(): Promise<Folder[]> {
    return this.folders.orderBy('sortOrder').toArray();
  }

  async updateFolderOrders(folders: Folder[]): Promise<void> {
    await this.transaction('rw', this.folders, async () => {
      for (let i = 0; i < folders.length; i++) {
        await this.folders.update(folders[i].id!, { sortOrder: i });
      }
    });
  }
}
