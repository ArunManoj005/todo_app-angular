import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Note } from '../models/note.model';

const STORAGE_KEY = 'local-notes-app-notes';

@Injectable({
  providedIn: 'root',
})
export class NoteStorageService {
  private readonly notesSubject = new BehaviorSubject<Note[]>(this.loadNotes());
  readonly notes$ = this.notesSubject.asObservable();

  constructor() {}

  // ---- public API ----

  createNote(payload: { title: string; content: string; pinned?: boolean }): Note {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      title: payload.title || 'Untitled',
      content: payload.content,
      pinned: payload.pinned ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newNote, ...this.notesSubject.value].sort(this.sortByPinnedAndUpdated);
    this.persist(updated);
    return newNote;
  }

  updateNote(note: Note): Note {
    const now = new Date().toISOString();
    const updatedNote: Note = { ...note, updatedAt: now };

    const updatedList = this.notesSubject.value
      .map((n) => (n.id === note.id ? updatedNote : n))
      .sort(this.sortByPinnedAndUpdated);

    this.persist(updatedList);
    return updatedNote;
  }

  deleteNote(id: string): void {
    const updated = this.notesSubject.value.filter((n) => n.id !== id);
    this.persist(updated);
  }

  togglePin(id: string): void {
    const updated = this.notesSubject.value
      .map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
      .sort(this.sortByPinnedAndUpdated);

    this.persist(updated);
  }

  // ---- internals ----

  private loadNotes(): Note[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Note[];
      return Array.isArray(parsed) ? parsed.sort(this.sortByPinnedAndUpdated) : [];
    } catch (e) {
      console.error('Failed to load notes from localStorage', e);
      return [];
    }
  }

  private persist(notes: Note[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      this.notesSubject.next(notes);
    } catch (e) {
      console.error('Failed to save notes to localStorage', e);
    }
  }

  private sortByPinnedAndUpdated(a: Note, b: Note): number {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  }
}
