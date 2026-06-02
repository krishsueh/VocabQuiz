import { Injectable } from '@angular/core';
import { Word } from '../models/word.model';

@Injectable({ providedIn: 'root' })
export class QuizStateService {
  words: Word[] = [];
  direction: 'ko-to-zh' | 'zh-to-ko' = 'ko-to-zh';
}
