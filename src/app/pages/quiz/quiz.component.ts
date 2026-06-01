import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DbService } from '../../services/db.service';
import { QuizService, QuizOptions, QuizSource } from '../../services/quiz.service';
import { ExportService } from '../../services/export.service';
import { Folder } from '../../models/folder.model';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './quiz.component.html',
})
export class QuizComponent implements OnInit {
  form!: FormGroup;
  folders: Folder[] = [];
  selectedSource: QuizSource = 'all';
  totalWords = 0;

  constructor(
    private fb: FormBuilder,
    private db: DbService,
    private quizService: QuizService,
    private exportService: ExportService,
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
    this.db.getAllWords().then(w => (this.totalWords = w.length));
  }

  setSource(source: QuizSource): void {
    this.selectedSource = source;
  }

  async generate(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    let words;
    if (this.selectedSource === 'all') {
      words = await this.db.getAllWords();
    } else if (this.selectedSource === 'favorites') {
      words = await this.db.getFavoriteWords();
    } else {
      words = await this.db.getWordsByFolder(this.selectedSource);
    }

    const options: QuizOptions = {
      count: this.form.value.count,
      direction: this.form.value.direction,
      source: this.selectedSource,
    };
    const quiz = this.quizService.generateQuiz(words, options);
    this.exportService.exportToExcel(quiz, options);
  }
}
