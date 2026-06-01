import { Injectable } from '@angular/core';
import { Word } from '../models/word.model';

export type QuizSource = 'all' | 'favorites' | number;

export interface QuizOptions {
  count: number;
  direction: 'ko-to-zh' | 'zh-to-ko';
  source: QuizSource;
}

@Injectable({ providedIn: 'root' })
export class QuizService {
  generateQuiz(words: Word[], options: QuizOptions): Word[] {
    const pool = [...words];
    const count = Math.min(options.count, pool.length);

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, count);
  }
}
