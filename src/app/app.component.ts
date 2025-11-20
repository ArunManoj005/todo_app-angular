import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { Note } from './models/note.model';
import { NoteStorageService } from './services/note-storage.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, DatePipe, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Local Storage Notes App';

  // --- UI state ---
  searchTerm = '';
  currentNote: Note = this.createEmptyNote();
  isEditing = false;

  // --- reactive streams ---
  notes$!: Observable<Note[]>;
  private readonly searchTermSubject = new BehaviorSubject<string>('');
  filteredNotes$!: Observable<Note[]>;

  constructor(private noteStorage: NoteStorageService) {}

  ngOnInit(): void {
    this.notes$ = this.noteStorage.notes$;

    this.filteredNotes$ = combineLatest([
      this.notes$,
      this.searchTermSubject,
    ]).pipe(
      map(([notes, term]) => {
        const t = term.toLowerCase().trim();
        if (!t) return notes;
        return notes.filter(
          (n) =>
            n.title.toLowerCase().includes(t) ||
            n.content.toLowerCase().includes(t),
        );
      }),
    );
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
    };
  }

  // ----- UI handlers -----

  onSearchChange(): void {
    this.searchTermSubject.next(this.searchTerm);
  }

  selectNote(note: Note): void {
    this.currentNote = { ...note }; // clone so we don't mutate list
    this.isEditing = true;
  }

  newNote(): void {
    this.currentNote = this.createEmptyNote();
    this.isEditing = false;
  }

  togglePin(note: Note, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.noteStorage.togglePin(note.id);
  }

  saveNote(): void {
    const trimmedTitle = this.currentNote.title.trim();
    const trimmedContent = this.currentNote.content.trim();

    if (!trimmedTitle && !trimmedContent) return;

    if (this.currentNote.id) {
      // update existing
      const updated = this.noteStorage.updateNote({
        ...this.currentNote,
        title: trimmedTitle || 'Untitled',
        content: trimmedContent,
      });
      this.currentNote = { ...updated };
      this.isEditing = true;
    } else {
      // create new
      const created = this.noteStorage.createNote({
        title: trimmedTitle || 'Untitled',
        content: trimmedContent,
        pinned: this.currentNote.pinned ?? false,
      });
      this.currentNote = { ...created };
      this.isEditing = true;
    }
  }

  deleteNote(noteId: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const confirmed = confirm('Are you sure you want to delete this note?');
    if (!confirmed) return;

    this.noteStorage.deleteNote(noteId);
    if (this.currentNote.id === noteId) {
      this.newNote();
    }
  }

  isCurrent(note: Note): boolean {
    return this.currentNote.id === note.id;
  }
}
