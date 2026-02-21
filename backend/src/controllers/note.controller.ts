import { Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// Helper: Check if user has access to a note
const getUserNotePermission = async (
    userId: string,
    noteId: string
): Promise<'OWNER' | 'EDITOR' | 'VIEWER' | null> => {
    const note = await prisma.note.findUnique({
        where: { id: noteId },
        include: {
            collaborators: {
                where: { user_id: userId },
            },
        },
    });

    if (!note) return null;
    if (note.owner_id === userId) return 'OWNER';

    const collaborator = note.collaborators[0];
    if (collaborator) return collaborator.permission;

    return null;
};

// Helper: Log activity
const logActivity = async (
    userId: string,
    noteId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SHARE'
): Promise<void> => {
    await prisma.activityLog.create({
        data: {
            user_id: userId,
            note_id: noteId,
            action,
        },
    });
};

// POST /notes
export const createNote = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, content } = req.body;
        const userId = req.user!.id;

        if (!title) {
            res.status(400).json({ error: 'Title is required' });
            return;
        }

        const note = await prisma.note.create({
            data: {
                title,
                content: content || '',
                owner_id: userId,
            },
            include: {
                owner: {
                    select: { id: true, name: true, email: true, role: true },
                },
            },
        });

        await logActivity(userId, note.id, 'CREATE');

        res.status(201).json({ note });
    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /notes
export const getNotes = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const userRole = req.user!.role;

        let notes;

        if (userRole === 'ADMIN') {
            // Admin can see all notes
            notes = await prisma.note.findMany({
                include: {
                    owner: { select: { id: true, name: true, email: true } },
                    collaborators: {
                        include: { user: { select: { id: true, name: true, email: true } } },
                    },
                },
                orderBy: { updated_at: 'desc' },
            });
        } else {
            // Users see their own notes + notes they collaborate on
            notes = await prisma.note.findMany({
                where: {
                    OR: [
                        { owner_id: userId },
                        { collaborators: { some: { user_id: userId } } },
                    ],
                },
                include: {
                    owner: { select: { id: true, name: true, email: true } },
                    collaborators: {
                        include: { user: { select: { id: true, name: true, email: true } } },
                    },
                },
                orderBy: { updated_at: 'desc' },
            });
        }

        res.json({ notes });
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /notes/:id
export const getNoteById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;
        const userRole = req.user!.role;

        const note = await prisma.note.findUnique({
            where: { id },
            include: {
                owner: { select: { id: true, name: true, email: true, role: true } },
                collaborators: {
                    include: { user: { select: { id: true, name: true, email: true } } },
                },
            },
        });

        if (!note) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }

        // Check permission
        const permission = await getUserNotePermission(userId, id);
        if (!permission && userRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        res.json({ note, permission: permission || (userRole === 'ADMIN' ? 'OWNER' : null) });
    } catch (error) {
        console.error('Get note error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT /notes/:id
export const updateNote = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const userId = req.user!.id;
        const userRole = req.user!.role;

        const permission = await getUserNotePermission(userId, id);

        if (!permission && userRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        if (permission === 'VIEWER') {
            res.status(403).json({ error: 'Viewers cannot edit notes' });
            return;
        }

        const updateData: { title?: string; content?: string } = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;

        const note = await prisma.note.update({
            where: { id },
            data: updateData,
            include: {
                owner: { select: { id: true, name: true, email: true } },
                collaborators: {
                    include: { user: { select: { id: true, name: true, email: true } } },
                },
            },
        });

        await logActivity(userId, id, 'UPDATE');

        res.json({ note });
    } catch (error) {
        console.error('Update note error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE /notes/:id
export const deleteNote = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;
        const userRole = req.user!.role;

        const note = await prisma.note.findUnique({ where: { id } });

        if (!note) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }

        // Only owner or ADMIN can delete
        if (note.owner_id !== userId && userRole !== 'ADMIN') {
            res.status(403).json({ error: 'Only the owner or admin can delete notes' });
            return;
        }

        await logActivity(userId, id, 'DELETE');
        await prisma.note.delete({ where: { id } });

        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /notes/search?q=term
export const searchNotes = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { q } = req.query;
        const userId = req.user!.id;
        const userRole = req.user!.role;

        if (!q || typeof q !== 'string') {
            res.status(400).json({ error: 'Search query is required' });
            return;
        }

        const searchTerm = `%${q}%`;

        let whereClause: any = {
            OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { content: { contains: q, mode: 'insensitive' } },
            ],
        };

        // Non-admin users can only search their own notes or collaborated notes
        if (userRole !== 'ADMIN') {
            whereClause = {
                AND: [
                    whereClause,
                    {
                        OR: [
                            { owner_id: userId },
                            { collaborators: { some: { user_id: userId } } },
                        ],
                    },
                ],
            };
        }

        const notes = await prisma.note.findMany({
            where: whereClause,
            include: {
                owner: { select: { id: true, name: true, email: true } },
            },
            orderBy: { updated_at: 'desc' },
            take: 50,
        });

        res.json({ notes });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /notes/:id/share - Generate public share token
export const shareNote = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;
        const userRole = req.user!.role;

        const permission = await getUserNotePermission(userId, id);
        if (!permission && userRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        if (permission === 'VIEWER') {
            res.status(403).json({ error: 'Viewers cannot share notes' });
            return;
        }

        const token = crypto.randomBytes(32).toString('hex');

        const note = await prisma.note.update({
            where: { id },
            data: { public_share_token: token },
        });

        await logActivity(userId, id, 'SHARE');

        res.json({
            share_url: `/public/${token}`,
            token,
        });
    } catch (error) {
        console.error('Share error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /notes/:id/collaborators
export const addCollaborator = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { email, permission } = req.body;
        const userId = req.user!.id;
        const userRole = req.user!.role;

        if (!email || !permission) {
            res.status(400).json({ error: 'Email and permission are required' });
            return;
        }

        if (!['EDITOR', 'VIEWER'].includes(permission)) {
            res.status(400).json({ error: 'Permission must be EDITOR or VIEWER' });
            return;
        }

        // Check if requesting user is owner or admin
        const note = await prisma.note.findUnique({ where: { id } });
        if (!note) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }

        if (note.owner_id !== userId && userRole !== 'ADMIN') {
            res.status(403).json({ error: 'Only the owner or admin can add collaborators' });
            return;
        }

        // Find user to add
        const targetUser = await prisma.user.findUnique({ where: { email } });
        if (!targetUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (targetUser.id === note.owner_id) {
            res.status(400).json({ error: 'Cannot add owner as collaborator' });
            return;
        }

        const collaborator = await prisma.collaborator.upsert({
            where: {
                note_id_user_id: { note_id: id, user_id: targetUser.id },
            },
            update: { permission },
            create: {
                note_id: id,
                user_id: targetUser.id,
                permission,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        res.status(201).json({ collaborator });
    } catch (error) {
        console.error('Add collaborator error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE /notes/:id/collaborators/:userId
export const removeCollaborator = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id, userId: targetUserId } = req.params;
        const userId = req.user!.id;
        const userRole = req.user!.role;

        const note = await prisma.note.findUnique({ where: { id } });
        if (!note) {
            res.status(404).json({ error: 'Note not found' });
            return;
        }

        if (note.owner_id !== userId && userRole !== 'ADMIN') {
            res.status(403).json({ error: 'Only the owner or admin can remove collaborators' });
            return;
        }

        await prisma.collaborator.delete({
            where: {
                note_id_user_id: { note_id: id, user_id: targetUserId },
            },
        });

        res.json({ message: 'Collaborator removed' });
    } catch (error) {
        console.error('Remove collaborator error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /notes/:id/activity
export const getActivityLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;
        const userRole = req.user!.role;

        const permission = await getUserNotePermission(userId, id);
        if (!permission && userRole !== 'ADMIN') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const logs = await prisma.activityLog.findMany({
            where: { note_id: id },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { timestamp: 'desc' },
            take: 50,
        });

        res.json({ logs });
    } catch (error) {
        console.error('Activity logs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
