import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { Note } from './models/note.model';

@Component({
  selector: 'app-note-dialog',
  standalone: true,
  imports: [FormsModule, NgFor, NgClass, NgIf],  // ⬅️ add NgIf here
  template: `
        <div
        class="dialog-container"
        [ngClass]="'color-' + (data.color || 'default')"
        >
      <div class="dialog-header">
        <h2>{{ data.id ? 'Edit Sticky Note' : 'Create Sticky Note' }}</h2>
      </div>

      <div class="dialog-section">
        <label>Label:</label>
        <div class="color-picker">
          <button
            *ngFor="let c of noteColors"
            class="color-choice"
            [class.active]="data.color === c"
            [ngClass]="'color-' + c"
            (click)="data.color = c"
          ></button>
        </div>
      </div>

      <label>
        Title
        <input [(ngModel)]="data.title" placeholder="Title..." />
      </label>

      <label>
  Content

  <!-- ⭐ Tiny toolbar above the textarea -->
  <div class="editor-toolbar">
    <button
      type="button"
      class="bullet-btn"
      (click)="toggleBullets(contentArea)"
    >
      • List
    </button>
  </div>

  <textarea
    #contentArea
    [(ngModel)]="data.content"
    placeholder="Write something..."
  ></textarea>
</label>

      <div class="attach-row">
  <label class="attach-btn">
    📎 Attach Image
    <input type="file" accept="image/*" (change)="onImageSelected($event)" hidden>
  </label>

  <button *ngIf="data.image" class="remove-img-btn" (click)="removeImage()">Remove</button>
</div>

<img *ngIf="data.image" [src]="data.image" class="image-preview" />


      <div class="dialog-footer">
        <button class="primary-btn" (click)="save()">Save</button>
        <button class="ghost-btn" (click)="close()">Cancel</button>
      </div>
    </div>
  `,
  styleUrls: ['./note-dialog.scss'],
})
export class NoteDialogComponent {
  noteColors: Note['color'][] = ['default', 'yellow', 'blue', 'green'];

  constructor(
    public dialogRef: MatDialogRef<NoteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Note
  ) {}

  save() {
    this.dialogRef.close(this.data);
  }

  close() {
    this.dialogRef.close(null);
  }

  // 📎 NEW METHODS
  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.data.image = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.data.image = null;
  }
  toggleBullets(textarea: HTMLTextAreaElement) {
  const value = textarea.value;
  if (!value) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  // If nothing selected, apply bullets to the current line
  const selStart = start;
  const selEnd = end > start ? end : start;

  // Find full lines that intersect the selection
  const lineStart = value.lastIndexOf('\n', selStart - 1) + 1; // -1 -> 0
  const nextNewline = value.indexOf('\n', selEnd);
  const lineEnd = nextNewline === -1 ? value.length : nextNewline;

  const before = value.slice(0, lineStart);
  const selection = value.slice(lineStart, lineEnd);
  const after = value.slice(lineEnd);

  const lines = selection.split('\n');

  const bulletPrefix = '• '; // you can change to "- " if you prefer

  // Check if ALL lines already have a bullet
  const allBulleted = lines.every((line) =>
    line.trimStart().startsWith(bulletPrefix.trim())
  );

  const newLines = lines.map((line) => {
  const trimmed = line.trimStart();
  if (!trimmed) return line; // keep completely empty lines as-is

  if (allBulleted) {
    // REMOVE bullet: assume normalized "• " prefix
    if (trimmed.startsWith(bulletPrefix)) {
      return trimmed.slice(bulletPrefix.length).trimStart();
    }
    return line;
  } else {
    // ADD bullet with normalized spacing: always "• " at start
    if (trimmed.startsWith(bulletPrefix)) return line; // already bulleted
    return bulletPrefix + trimmed;
  }
});


  const newSelection = newLines.join('\n');
  const newValue = before + newSelection + after;

  // Update textarea + ngModel
  textarea.value = newValue;
  this.data.content = newValue;

  // Reselect the same lines (optional but nice)
  const newStart = lineStart;
  const newEnd = lineStart + newSelection.length;
  textarea.setSelectionRange(newStart, newEnd);
  textarea.focus();
}

}

