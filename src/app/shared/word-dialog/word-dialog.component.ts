import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DbService } from '../../services/db.service';
import { Word, WordCategory, WORD_CATEGORIES } from '../../models/word.model';
import { Folder } from '../../models/folder.model';

export interface WordDialogData {
  word?: Word;
}

@Component({
  selector: 'app-word-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './word-dialog.component.html',
})
export class WordDialogComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  folders: Folder[] = [];
  readonly categories = WORD_CATEGORIES;

  constructor(
    private fb: FormBuilder,
    private db: DbService,
    private dialogRef: DialogRef<void>,
    @Inject(DIALOG_DATA) public data: WordDialogData,
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.data?.word;
    this.form = this.fb.group({
      korean: [this.data?.word?.korean ?? '', Validators.required],
      chinese: [this.data?.word?.chinese ?? '', Validators.required],
      folderId: [this.data?.word?.folderId ?? null],
      category: [this.data?.word?.category ?? null],
    });
    this.db.getAllFolders().then(f => (this.folders = f));
  }

  selectCategory(cat: WordCategory | null): void {
    const current = this.form.get('category')!.value;
    this.form.get('category')!.setValue(current === cat ? null : cat);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { korean, chinese, folderId, category } = this.form.value;
    const folderIdValue = folderId ? Number(folderId) : null;
    if (this.isEdit && this.data.word?.id != null) {
      await this.db.updateWord(this.data.word.id, { korean, chinese, folderId: folderIdValue, category });
    } else {
      await this.db.addWord({ korean, chinese, folderId: folderIdValue, category, isFavorite: false, createdAt: new Date() });
    }
    this.dialogRef.close();
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
