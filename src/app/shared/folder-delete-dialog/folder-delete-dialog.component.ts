import { Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Folder } from '../../models/folder.model';

export interface FolderDeleteDialogData {
  folder: Folder;
  wordCount: number;
}

export type FolderDeleteResult = 'folder-only' | 'folder-and-words';

@Component({
  selector: 'app-folder-delete-dialog',
  standalone: true,
  template: `
    <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
      <h2 class="text-base font-semibold text-gray-800 mb-1">
        刪除「{{ data.folder.name }}」
      </h2>
      <p class="text-sm text-gray-500 mb-4">
        此資料夾內有 <span class="font-medium text-gray-700">{{ data.wordCount }}</span> 個單字，請選擇操作方式：
      </p>

      <div class="space-y-2 mb-4">
        <button
          (click)="close('folder-only')"
          class="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <p class="text-sm font-medium text-gray-800">僅刪除資料夾</p>
          <p class="text-xs text-gray-400 mt-0.5">
            {{ data.wordCount }} 個單字保留，移至不指定資料夾
          </p>
        </button>

        <button
          (click)="close('folder-and-words')"
          class="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-red-200 hover:bg-red-50 transition-colors"
        >
          <p class="text-sm font-medium text-red-600">刪除資料夾及所有單字</p>
          <p class="text-xs text-gray-400 mt-0.5">
            {{ data.wordCount }} 個單字將一併移除，無法復原
          </p>
        </button>
      </div>

      <button
        (click)="dialogRef.close()"
        class="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >取消</button>
    </div>
  `,
})
export class FolderDeleteDialogComponent {
  dialogRef = inject(DialogRef<FolderDeleteResult>);
  data = inject<FolderDeleteDialogData>(DIALOG_DATA);

  close(result: FolderDeleteResult): void {
    this.dialogRef.close(result);
  }
}
