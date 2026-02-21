import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /public/:token - No authentication required
router.get('/:token', async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;

        const note = await prisma.note.findUnique({
            where: { public_share_token: token },
            select: {
                id: true,
                title: true,
                content: true,
                created_at: true,
                updated_at: true,
                owner: {
                    select: { name: true, email: true },
                },
            },
        });

        if (!note) {
            res.status(404).json({ error: 'Note not found or link expired' });
            return;
        }

        res.json({ note });
    } catch (error) {
        console.error('Public note error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export { router as publicRouter };
