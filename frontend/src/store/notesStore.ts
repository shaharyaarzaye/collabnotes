import { create } from 'zustand';
import { notesApi, Note } from '../api/notes';

interface NotesState {
    notes: Note[];
    currentNote: Note | null;
    permission: string | null;
    isLoading: boolean;
    searchQuery: string;
    searchResults: Note[];

    fetchNotes: () => Promise<void>;
    fetchNote: (id: string) => Promise<void>;
    createNote: (title: string, content?: string) => Promise<Note>;
    updateNote: (id: string, data: { title?: string; content?: string }) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    searchNotes: (query: string) => Promise<void>;
    setSearchQuery: (query: string) => void;
    setCurrentNote: (note: Note | null) => void;
    updateCurrentNoteLocally: (data: { title?: string; content?: string; updated_at?: string }) => void;
    clearSearch: () => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
    notes: [],
    currentNote: null,
    permission: null,
    isLoading: false,
    searchQuery: '',
    searchResults: [],

    fetchNotes: async () => {
        set({ isLoading: true });
        try {
            const { data } = await notesApi.getAll();
            set({ notes: data.notes, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    fetchNote: async (id: string) => {
        set({ isLoading: true });
        try {
            const { data } = await notesApi.getById(id);
            set({ currentNote: data.note, permission: data.permission, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    createNote: async (title: string, content?: string) => {
        const { data } = await notesApi.create(title, content);
        set((state) => ({ notes: [data.note, ...state.notes] }));
        return data.note;
    },

    updateNote: async (id: string, updateData: { title?: string; content?: string }) => {
        const { data } = await notesApi.update(id, updateData);
        set((state) => ({
            notes: state.notes.map((n) => (n.id === id ? data.note : n)),
            currentNote: state.currentNote?.id === id ? data.note : state.currentNote,
        }));
    },

    deleteNote: async (id: string) => {
        await notesApi.delete(id);
        set((state) => ({
            notes: state.notes.filter((n) => n.id !== id),
            currentNote: state.currentNote?.id === id ? null : state.currentNote,
        }));
    },

    searchNotes: async (query: string) => {
        if (!query.trim()) {
            set({ searchResults: [], searchQuery: '' });
            return;
        }
        set({ searchQuery: query });
        try {
            const { data } = await notesApi.search(query);
            set({ searchResults: data.notes });
        } catch (error) {
            set({ searchResults: [] });
        }
    },

    setSearchQuery: (query: string) => set({ searchQuery: query }),

    setCurrentNote: (note: Note | null) => set({ currentNote: note }),

    updateCurrentNoteLocally: (data) => {
        set((state) => {
            if (!state.currentNote) return state;
            return {
                currentNote: { ...state.currentNote, ...data },
            };
        });
    },

    clearSearch: () => set({ searchQuery: '', searchResults: [] }),
}));
