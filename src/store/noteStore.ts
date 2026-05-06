import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Note } from '../types';
import { fileStorage } from '../services/storageService';

interface NoteState {
  notes: Note[];
  tags: string[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  addCustomTag: (tag: string) => void;
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set) => ({
      notes: [],
      tags: ['Trabajo', 'Personal', 'Ideas', 'Importante', 'Amor', 'Estudio'],
      addNote: (note) =>
        set((state) => ({
          notes: [
            {
              ...note,
              id: Math.random().toString(36).substring(7),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...state.notes,
          ],
        })),
      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
          ),
        })),
      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        })),
      togglePin: (id) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() } : n
          ),
        })),
      addCustomTag: (tag) =>
        set((state) => {
          if (!state.tags.includes(tag)) {
            return { tags: [...state.tags, tag] };
          }
          return state;
        }),
    }),
    {
      name: 'notes-storage',
      storage: createJSONStorage(() => fileStorage),
    }
  )
);
