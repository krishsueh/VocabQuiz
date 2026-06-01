import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Word } from '../models/word.model';
import { Folder } from '../models/folder.model';

@Injectable({ providedIn: 'root' })
export class DbService {
  private db: SupabaseClient;

  constructor() {
    this.db = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // Word CRUD
  async addWord(word: Omit<Word, 'id'>): Promise<number> {
    const { data, error } = await this.db
      .from('words')
      .insert({
        korean: word.korean,
        chinese: word.chinese,
        folder_id: word.folderId,
        is_favorite: word.isFavorite,
        category: word.category,
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }

  async updateWord(id: number, changes: Partial<Word>): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (changes.korean !== undefined) patch['korean'] = changes.korean;
    if (changes.chinese !== undefined) patch['chinese'] = changes.chinese;
    if (changes.folderId !== undefined) patch['folder_id'] = changes.folderId;
    if (changes.isFavorite !== undefined) patch['is_favorite'] = changes.isFavorite;
    if (changes.category !== undefined) patch['category'] = changes.category;
    const { error } = await this.db.from('words').update(patch).eq('id', id);
    if (error) throw error;
  }

  async deleteWord(id: number): Promise<void> {
    const { error } = await this.db.from('words').delete().eq('id', id);
    if (error) throw error;
  }

  async getAllWords(): Promise<Word[]> {
    const { data, error } = await this.db
      .from('words').select('*').order('korean');
    if (error) throw error;
    return (data ?? []).map(this.toWord);
  }

  async getWordsByFolder(folderId: number): Promise<Word[]> {
    const { data, error } = await this.db
      .from('words').select('*').eq('folder_id', folderId).order('korean');
    if (error) throw error;
    return (data ?? []).map(this.toWord);
  }

  async getFavoriteWords(): Promise<Word[]> {
    const { data, error } = await this.db
      .from('words').select('*').eq('is_favorite', true).order('korean');
    if (error) throw error;
    return (data ?? []).map(this.toWord);
  }

  async toggleFavorite(id: number, isFavorite: boolean): Promise<void> {
    const { error } = await this.db
      .from('words').update({ is_favorite: isFavorite }).eq('id', id);
    if (error) throw error;
  }

  // Folder CRUD
  async addFolder(name: string): Promise<number> {
    const { data: rows } = await this.db
      .from('folders').select('sort_order')
      .order('sort_order', { ascending: false }).limit(1);
    const sortOrder = rows && rows.length > 0 ? (rows[0].sort_order ?? 0) + 1 : 0;
    const { data, error } = await this.db
      .from('folders').insert({ name, sort_order: sortOrder }).select('id').single();
    if (error) throw error;
    return data.id;
  }

  async updateFolder(id: number, name: string): Promise<void> {
    const { error } = await this.db.from('folders').update({ name }).eq('id', id);
    if (error) throw error;
  }

  async getWordCountByFolder(folderId: number): Promise<number> {
    const { count, error } = await this.db
      .from('words').select('*', { count: 'exact', head: true }).eq('folder_id', folderId);
    if (error) throw error;
    return count ?? 0;
  }

  async deleteFolder(id: number): Promise<void> {
    await this.db.from('words').update({ folder_id: null }).eq('folder_id', id);
    const { error } = await this.db.from('folders').delete().eq('id', id);
    if (error) throw error;
  }

  async deleteWordsAndFolder(id: number): Promise<void> {
    await this.db.from('words').delete().eq('folder_id', id);
    const { error } = await this.db.from('folders').delete().eq('id', id);
    if (error) throw error;
  }

  async getAllFolders(): Promise<Folder[]> {
    const { data, error } = await this.db
      .from('folders').select('*').order('sort_order');
    if (error) throw error;
    return (data ?? []).map(this.toFolder);
  }

  async updateFolderOrders(folders: Folder[]): Promise<void> {
    for (let i = 0; i < folders.length; i++) {
      await this.db.from('folders').update({ sort_order: i }).eq('id', folders[i].id!);
    }
  }

  private toWord(row: Record<string, unknown>): Word {
    return {
      id: row['id'] as number,
      korean: row['korean'] as string,
      chinese: row['chinese'] as string,
      folderId: row['folder_id'] as number | null,
      isFavorite: row['is_favorite'] as boolean,
      category: row['category'] as Word['category'],
      createdAt: new Date(row['created_at'] as string),
    };
  }

  private toFolder(row: Record<string, unknown>): Folder {
    return {
      id: row['id'] as number,
      name: row['name'] as string,
      sortOrder: row['sort_order'] as number,
      createdAt: new Date(row['created_at'] as string),
    };
  }
}
