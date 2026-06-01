export type WordCategory = '動詞' | '名詞' | '片語' | '形容詞' | '文法';

export const WORD_CATEGORIES: WordCategory[] = ['動詞', '名詞', '片語', '形容詞', '文法'];

export const CATEGORY_COLOR: Record<WordCategory, string> = {
  動詞: 'bg-blue-100 text-blue-700',
  名詞: 'bg-green-100 text-green-700',
  片語: 'bg-orange-100 text-orange-700',
  形容詞: 'bg-purple-100 text-purple-700',
  文法: 'bg-gray-100 text-gray-600',
};

export interface Word {
  id?: number;
  korean: string;
  chinese: string;
  folderId: number | null;
  isFavorite: boolean;
  category: WordCategory | null;
  createdAt: Date;
}
