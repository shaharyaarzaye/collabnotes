import { useEffect, useRef, useCallback } from 'react';
import { getSocket, joinNoteRoom, leaveNoteRoom, emitNoteUpdate, connectSocket } from '../sockets/socket';
import { useNotesStore } from '../store/notesStore';

interface UseSocketNoteOptions {
    noteId: string | undefined;
    enabled?: boolean;
}

export const useSocketNote = ({ noteId, enabled = true }: UseSocketNoteOptions) => {
    const updateCurrentNoteLocally = useNotesStore((s) => s.updateCurrentNoteLocally);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!noteId || !enabled) return;

        connectSocket();
        const socket = getSocket();

        joinNoteRoom(noteId);

        const handleUpdated = (data: {
            noteId: string;
            title: string;
            content: string;
            updated_at: string;
            updatedBy: { userId: string; email: string };
        }) => {
            if (data.noteId === noteId) {
                updateCurrentNoteLocally({
                    title: data.title,
                    content: data.content,
                    updated_at: data.updated_at,
                });
            }
        };

        const handleUserJoined = (data: { userId: string; email: string }) => {
            console.log(`User joined: ${data.email}`);
        };

        const handleUserLeft = (data: { userId: string; email: string }) => {
            console.log(`User left: ${data.email}`);
        };

        socket.on('note:updated', handleUpdated);
        socket.on('note:user-joined', handleUserJoined);
        socket.on('note:user-left', handleUserLeft);

        return () => {
            leaveNoteRoom(noteId);
            socket.off('note:updated', handleUpdated);
            socket.off('note:user-joined', handleUserJoined);
            socket.off('note:user-left', handleUserLeft);
        };
    }, [noteId, enabled, updateCurrentNoteLocally]);

    const sendUpdate = useCallback(
        (data: { title?: string; content?: string }) => {
            if (!noteId) return;

            // Debounce socket emissions
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            debounceRef.current = setTimeout(() => {
                emitNoteUpdate({
                    noteId,
                    ...data,
                    updated_at: new Date().toISOString(),
                });
            }, 300);
        },
        [noteId]
    );

    return { sendUpdate };
};
