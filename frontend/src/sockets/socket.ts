import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        const token = localStorage.getItem('token');
        socket = io(SOCKET_URL, {
            auth: { token },
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
    }
    return socket;
};

export const connectSocket = (): void => {
    const s = getSocket();
    if (!s.connected) {
        // Update token before connecting
        const token = localStorage.getItem('token');
        s.auth = { token };
        s.connect();
    }
};

export const disconnectSocket = (): void => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const joinNoteRoom = (noteId: string): void => {
    const s = getSocket();
    s.emit('note:join', noteId);
};

export const leaveNoteRoom = (noteId: string): void => {
    const s = getSocket();
    s.emit('note:leave', noteId);
};

export const emitNoteUpdate = (data: {
    noteId: string;
    title?: string;
    content?: string;
    updated_at: string;
}): void => {
    const s = getSocket();
    s.emit('note:update', data);
};
