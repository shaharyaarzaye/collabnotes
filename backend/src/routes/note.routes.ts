import { Router } from 'express';
import {
    createNote,
    getNotes,
    getNoteById,
    updateNote,
    deleteNote,
    searchNotes,
    shareNote,
    addCollaborator,
    removeCollaborator,
    getActivityLogs,
} from '../controllers/note.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Search must come before :id route
router.get('/search', searchNotes);

// CRUD
router.post('/', createNote);
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

// Sharing & Collaboration
router.post('/:id/share', shareNote);
router.post('/:id/collaborators', addCollaborator);
router.delete('/:id/collaborators/:userId', removeCollaborator);

// Activity logs
router.get('/:id/activity', getActivityLogs);

export { router as noteRouter };
