import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [FormsModule, MatInputModule, MatButtonModule],
  template: `
    <h2>Edit Note</h2>

    <mat-form-field appearance="fill" style="width:100%">
      <mat-label>Title</mat-label>
      <input matInput [(ngModel)]="data.title" />
    </mat-form-field>

    <mat-form-field appearance="fill" style="width:100%">
      <mat-label>Content</mat-label>
      <textarea matInput rows="6" [(ngModel)]="data.content"></textarea>
    </mat-form-field>

    <div style="text-align:right;">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button color="primary" (click)="dialogRef.close(data)">Save</button>
    </div>
  `
})
export class EditDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}
