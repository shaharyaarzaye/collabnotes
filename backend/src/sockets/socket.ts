import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userEmail?: string;
}

export const setupSocket = (io: Server): void => {
    // Authenticate socket connections
    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
                id: string;
                email: string;
            };
            socket.userId = decoded.id;
            socket.userEmail = decoded.email;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`📡 User connected: ${socket.userEmail} (${socket.id})`);

        // Join a note room
        socket.on('note:join', (noteId: string) => {
            const room = `note:${noteId}`;
            socket.join(room);
            console.log(`📝 ${socket.userEmail} joined room ${room}`);

            // Notify others in the room
            socket.to(room).emit('note:user-joined', {
                userId: socket.userId,
                email: socket.userEmail,
            });
        });

        // Leave a note room
        socket.on('note:leave', (noteId: string) => {
            const room = `note:${noteId}`;
            socket.leave(room);
            console.log(`📝 ${socket.userEmail} left room ${room}`);

            socket.to(room).emit('note:user-left', {
                userId: socket.userId,
                email: socket.userEmail,
            });
        });

        // Handle note updates
        socket.on(
            'note:update',
            async (data: { noteId: string; title?: string; content?: string; updated_at: string }) => {
                const room = `note:${data.noteId}`;

                try {
                    // Get the current note to check for stale updates
                    const currentNote = await prisma.note.findUnique({
                        where: { id: data.noteId },
                    });

                    if (!currentNote) return;

                    // Last write wins - update the database
                    const updateData: { title?: string; content?: string } = {};
                    if (data.title !== undefined) updateData.title = data.title;
                    if (data.content !== undefined) updateData.content = data.content;

                    const updatedNote = await prisma.note.update({
                        where: { id: data.noteId },
                        data: updateData,
                    });

                    // Broadcast to other users in the room
                    socket.to(room).emit('note:updated', {
                        noteId: data.noteId,
                        title: updatedNote.title,
                        content: updatedNote.content,
                        updated_at: updatedNote.updated_at.toISOString(),
                        updatedBy: {
                            userId: socket.userId,
                            email: socket.userEmail,
                        },
                    });

                    // Log the activity
                    await prisma.activityLog.create({
                        data: {
                            user_id: socket.userId!,
                            note_id: data.noteId,
                            action: 'UPDATE',
                        },
                    });
                } catch (error) {
                    console.error('Socket note:update error:', error);
                    socket.emit('note:error', { message: 'Failed to update note' });
                }
            }
        );

        // Cursor position sharing (optional enhancement for UX)
        socket.on('note:cursor', (data: { noteId: string; position: number }) => {
            const room = `note:${data.noteId}`;
            socket.to(room).emit('note:cursor-update', {
                userId: socket.userId,
                email: socket.userEmail,
                position: data.position,
            });
        });

        socket.on('disconnect', () => {
            console.log(`📡 User disconnected: ${socket.userEmail} (${socket.id})`);
        });
    });
};
