import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NoteDialogComponent } from './note-dialog.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgFor, NgIf, DatePipe, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
} from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Note } from './models/note.model';
import { NoteStorageService } from './services/note-storage.service';

type SortMode = 'newest' | 'oldest';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    FormsModule,
    DatePipe,
    AsyncPipe,
    MatDialogModule,     
    MatSnackBarModule,   
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Local Storage Notes App';
  searchTerm = '';
  sortMode: SortMode = 'newest';
  isDark = false;

  noteColors: Note['color'][] = ['default', 'yellow', 'blue', 'green'];

  colorMap: Record<string, string> = {
    default: '',
    yellow: '#facc15',
    blue: '#38bdf8',
    green: '#4ade80',
    '': '',
  };

  currentNote: Note = this.createEmptyNote();
  isEditing = false;
  notes$!: Observable<Note[]>;
  private readonly searchTermSubject = new BehaviorSubject<string>('');
  private readonly sortModeSubject = new BehaviorSubject<SortMode>('newest');
  filteredNotes$!: Observable<Note[]>;

  private readonly autoSaveSubject = new BehaviorSubject<Note | null>(null);

  constructor(
    private noteStorage: NoteStorageService,
    private dialog: MatDialog,        
    private snack: MatSnackBar       
  ) {}

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDark = savedTheme === 'dark';

    if (this.isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }

    this.notes$ = this.noteStorage.notes$;

    this.filteredNotes$ = combineLatest([
      this.notes$,
      this.searchTermSubject,
      this.sortModeSubject,
    ]).pipe(
      map(([notes, term, mode]) => {
        const t = term.toLowerCase().trim();
        let result = t
          ? notes.filter(
              (n) =>
                n.title.toLowerCase().includes(t) ||
                n.content.toLowerCase().includes(t),
            )
          : notes;

        if (mode === 'oldest') {
          result = [...result].reverse();
        }

        return result;
      }),
    );

    this.autoSaveSubject
      .pipe(debounceTime(600))
      .subscribe((note) => {
        if (!note) return;
        this.performSave(note, true);
      });
  }

  private createEmptyNote(): Note {
    const now = new Date().toISOString();
    return {
      id: '',
      title: '',
      content: '',
      createdAt: now,
      updatedAt: now,
      pinned: false,
      color: 'default',
    };
  }


  onSearchChange(): void {
    this.searchTermSubject.next(this.searchTerm);
  }

  onSortModeChange(mode: SortMode): void {
    this.sortMode = mode;
    this.sortModeSubject.next(mode);
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;

    if (this.isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  setColor(color: Note['color']): void {
    this.currentNote.color = color;
    this.touchEditor();
  }

  selectNote(note: Note): void {
    const dialogRef = this.dialog.open(NoteDialogComponent, {
      width: '450px',
      data: { ...note },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.noteStorage.updateNote(result);
      this.snack.open('Note updated!', 'OK', { duration: 2000 });
    });
  }

  newNote(): void {
    const dialogRef = this.dialog.open(NoteDialogComponent, {
      width: '450px',
      data: this.createEmptyNote(),
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.noteStorage.createNote(result);
      this.snack.open('Note created!', 'OK', { duration: 2000 });
    });
  }

  deleteNote(noteId: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const confirmed = confirm('Are you sure you want to delete this note?');
    if (!confirmed) return;

    this.noteStorage.deleteNote(noteId);
    if (this.currentNote.id === noteId) {
      this.currentNote = this.createEmptyNote();
    }
  }

  togglePin(note: Note, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.noteStorage.togglePin(note.id);
  }

  isCurrent(note: Note): boolean {
    return this.currentNote.id === note.id;
  }

  saveNote(): void {
    this.performSave(this.currentNote, false);
  }

  onEditorChange(): void {
    this.touchEditor();
  }

  private touchEditor(): void {
    this.currentNote.updatedAt = new Date().toISOString();
    this.autoSaveSubject.next({ ...this.currentNote });
  }

  private performSave(note: Note, isAuto: boolean): void {
    const trimmedTitle = note.title.trim();
    const trimmedContent = note.content.trim();

    if (!trimmedTitle && !trimmedContent) {
      return;
    }
    if (note.id) {
      const updated = this.noteStorage.updateNote({
        ...note,
        title: trimmedTitle || 'Untitled',
        content: trimmedContent,
      });
      if (!isAuto) {
        this.currentNote = { ...updated };
      }
    } else {
      const created = this.noteStorage.createNote({
        title: trimmedTitle || 'Untitled',
        content: trimmedContent,
        pinned: note.pinned ?? false,
        color: note.color,
      });
      this.currentNote = { ...created };
      this.isEditing = true;
    }
  }
}
