import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Word } from '../models/word.model';
import { QuizOptions } from './quiz.service';

@Injectable({ providedIn: 'root' })
export class ExportService {
  exportToExcel(words: Word[], options: QuizOptions): void {
    const isKoToZh = options.direction === 'ko-to-zh';
    const questionHeader = isKoToZh ? '題目（韓文）' : '題目（中文）';

    const rows: (string | number)[][] = [
      ['題號', questionHeader, '作答'],
      ...words.map((w, i) => [
        i + 1,
        isKoToZh ? w.korean : w.chinese,
        '',
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws['!cols'] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 40 },
    ];

    (ws as any)['!pageSetup'] = {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
    };

    ws['!margins'] = {
      left: 0.59,
      right: 0.59,
      top: 0.59,
      bottom: 0.59,
      header: 0,
      footer: 0,
    };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '考卷');

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(wb, `quiz-${dateStr}.xlsx`);
  }
}
