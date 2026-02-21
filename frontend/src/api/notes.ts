import api from './axios';

export interface Note {
    id: string;
    title: string;
    content: string;
    owner_id: string;
    created_at: string;
    updated_at: string;
    public_share_token: string | null;
    owner?: { id: string; name: string; email: string; role?: string };
    collaborators?: Array<{
        id: string;
        permission: 'EDITOR' | 'VIEWER';
        user: { id: string; name: string; email: string };
    }>;
}

export interface ActivityLog {
    id: string;
    user_id: string;
    note_id: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SHARE';
    timestamp: string;
    user: { id: string; name: string; email: string };
}

export const notesApi = {
    create: (title: string, content?: string) =>
        api.post<{ note: Note }>('/notes', { title, content }),

    getAll: () =>
        api.get<{ notes: Note[] }>('/notes'),

    getById: (id: string) =>
        api.get<{ note: Note; permission: string }>(`/notes/${id}`),

    update: (id: string, data: { title?: string; content?: string }) =>
        api.put<{ note: Note }>(`/notes/${id}`, data),

    delete: (id: string) =>
        api.delete(`/notes/${id}`),

    search: (query: string) =>
        api.get<{ notes: Note[] }>(`/notes/search?q=${encodeURIComponent(query)}`),

    share: (id: string) =>
        api.post<{ share_url: string; token: string }>(`/notes/${id}/share`),

    addCollaborator: (id: string, email: string, permission: 'EDITOR' | 'VIEWER') =>
        api.post(`/notes/${id}/collaborators`, { email, permission }),

    removeCollaborator: (noteId: string, userId: string) =>
        api.delete(`/notes/${noteId}/collaborators/${userId}`),

    getActivity: (id: string) =>
        api.get<{ logs: ActivityLog[] }>(`/notes/${id}/activity`),

    getPublic: (token: string) =>
        api.get<{ note: Note }>(`/public/${token}`),
};
