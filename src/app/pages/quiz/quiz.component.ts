import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DbService } from '../../services/db.service';
import { QuizService } from '../../services/quiz.service';
import { QuizStateService } from '../../services/quiz-state.service';
import { Folder } from '../../models/folder.model';
import { Word } from '../../models/word.model';

type Source = 'all' | 'favorites' | number;

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './quiz.component.html',
})
export class QuizComponent implements OnInit {
  form!: FormGroup;
  folders: Folder[] = [];
  selectedSources = new Set<Source>(['all']);
  sourceWordCount = 0;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private db: DbService,
    private quizService: QuizService,
    private quizState: QuizStateService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      count: [20, [Validators.required, Validators.min(1)]],
      direction: ['ko-to-zh', Validators.required],
    });
    this.loadMeta();
  }

  private async loadMeta(): Promise<void> {
    this.folders = await this.db.getAllFolders();
    await this.updateWordCount();
  }

  isSelected(source: Source): boolean {
    return this.selectedSources.has(source);
  }

  toggleSource(source: Source): void {
    if (source === 'all') {
      this.selectedSources = new Set<Source>(['all']);
    } else {
      this.selectedSources.delete('all');
      if (this.selectedSources.has(source)) {
        this.selectedSources.delete(source);
        if (this.selectedSources.size === 0) {
          this.selectedSources = new Set<Source>(['all']);
        }
      } else {
        this.selectedSources.add(source);
      }
    }
    this.updateWordCount();
  }

  private async updateWordCount(): Promise<void> {
    const words = await this.fetchWordsForSources();
    this.sourceWordCount = words.length;
  }

  private async fetchWordsForSources(): Promise<Word[]> {
    if (this.selectedSources.has('all')) {
      return this.db.getAllWords();
    }
    const buckets = await Promise.all(
      [...this.selectedSources].map(s =>
        s === 'favorites' ? this.db.getFavoriteWords() : this.db.getWordsByFolder(s as number)
      )
    );
    const seen = new Set<number>();
    return buckets.flat().filter(w => {
      if (seen.has(w.id!)) return false;
      seen.add(w.id!);
      return true;
    });
  }

  async generate(): Promise<void> {
    if (this.form.invalid || this.sourceWordCount === 0) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    try {
      const words = await this.fetchWordsForSources();
      const { count, direction } = this.form.value;
      const quizWords = this.quizService.generateQuiz(words, { count, direction, source: 'all' });
      this.quizState.words = quizWords;
      this.quizState.direction = direction;
      this.router.navigate(['/quiz/play']);
    } finally {
      this.isLoading = false;
    }
  }
}
