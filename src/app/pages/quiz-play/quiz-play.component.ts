import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { QuizStateService } from '../../services/quiz-state.service';
import { Word, CATEGORY_COLOR } from '../../models/word.model';

@Component({
  selector: 'app-quiz-play',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quiz-play.component.html',
})
export class QuizPlayComponent implements OnInit {
  words: Word[] = [];
  direction: 'ko-to-zh' | 'zh-to-ko' = 'ko-to-zh';
  showAnswers = false;
  readonly categoryColor = CATEGORY_COLOR;

  constructor(private quizState: QuizStateService, private router: Router) {}

  ngOnInit(): void {
    if (this.quizState.words.length === 0) {
      this.router.navigate(['/quiz']);
      return;
    }
    this.words = this.quizState.words;
    this.direction = this.quizState.direction;
  }

  get questionLang(): 'korean' | 'chinese' {
    return this.direction === 'ko-to-zh' ? 'korean' : 'chinese';
  }

  get answerLang(): 'korean' | 'chinese' {
    return this.direction === 'ko-to-zh' ? 'chinese' : 'korean';
  }

  toggleAnswers(): void {
    this.showAnswers = !this.showAnswers;
  }

  exit(): void {
    this.quizState.words = [];
    this.router.navigate(['/quiz']);
  }
}
