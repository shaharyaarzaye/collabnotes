import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotesStore } from '../store/notesStore';
import { useAuthStore } from '../store/authStore';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Users, Trash2, FileText, Calendar, ArrowRight, Loader2 } from 'lucide-react';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { notes, isLoading, fetchNotes, createNote, deleteNote, searchNotes, searchQuery, searchResults, setSearchQuery, clearSearch } = useNotesStore();
    const user = useAuthStore((s) => s.user);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [creating, setCreating] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (showCreateModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showCreateModal]);

    useEffect(() => {
        fetchNotes().catch(() => toast.error('Failed to load notes'));
    }, [fetchNotes]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        setCreating(true);
        try {
            const note = await createNote(newTitle.trim());
            setShowCreateModal(false);
            setNewTitle('');
            toast.success('Note created!');
            navigate(`/notes/${note.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create note');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this note?')) return;
        try {
            await deleteNote(id);
            toast.success('Note deleted');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Cannot delete note');
        }
    };

    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);
        if (searchTimeout) clearTimeout(searchTimeout);

        if (!value.trim()) {
            clearSearch();
            return;
        }

        const timeout = setTimeout(() => {
            searchNotes(value);
        }, 300);
        setSearchTimeout(timeout);
    }, [searchNotes, setSearchQuery, clearSearch, searchTimeout]);

    const displayNotes = searchQuery.trim() ? searchResults : notes;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hrs ago`;
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    const isOwner = (note: any) => note.owner_id === user?.id;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1 }
    };

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                            Welcome back, <span className="bg-linear-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">{user?.name?.split(' ')[0] || 'User'}</span>
                        </h1>
                        <p className="text-text-secondary mt-2 text-lg font-medium opacity-80">
                            {notes.length} note{notes.length !== 1 ? 's' : ''} available
                        </p>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg"
                        onClick={() => setShowCreateModal(true)}
                        id="create-note-btn"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        New Note
                    </motion.button>
                </div>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand-primary transition-colors" />
                        <input
                            type="text"
                            className="glass-input pl-12 h-12 text-base"
                            placeholder="Search notes by title or content..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            id="search-input"
                        />
                        {searchQuery && (
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
                                onClick={() => { clearSearch(); }}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Notes Grid */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
                        <p className="text-text-muted font-medium animate-pulse">Scanning your database...</p>
                    </div>
                ) : displayNotes.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card rounded-3xl p-12 text-center border-dashed border-2 border-border-primary/50"
                    >
                        <div className="w-20 h-20 bg-bg-tertiary rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl">
                            {searchQuery ? '🔍' : '📝'}
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{searchQuery ? 'No results found' : 'No notes yet'}</h3>
                        <p className="text-text-secondary max-w-sm mx-auto mb-8">
                            {searchQuery
                                ? `We couldn't find any notes matching "${searchQuery}". Maybe try a different keyword?`
                                : 'Your digital notebook is waiting. Create your first note and start collaborating in real-time!'}
                        </p>
                        {!searchQuery && (
                            <button
                                className="btn-primary"
                                onClick={() => setShowCreateModal(true)}
                            >
                                Get Started
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {displayNotes.map((note) => (
                            <motion.div
                                key={note.id}
                                variants={itemVariants}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                className="group glass-card rounded-[24px] p-6 cursor-pointer flex flex-col h-[240px] hover:border-brand-primary/40 transition-all shadow-lg hover:shadow-brand-primary/5"
                                onClick={() => navigate(`/notes/${note.id}`)}
                                id={`note-card-${note.id}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="font-bold text-lg text-text-primary line-clamp-1 group-hover:text-brand-primary transition-colors pr-2">
                                        {note.title}
                                    </h3>
                                    <div className="flex shrink-0">
                                        {isOwner(note) ? (
                                            <span className="badge badge-owner text-[9px] uppercase tracking-wider px-2 py-0.5">Owner</span>
                                        ) : (
                                            <span className="badge badge-editor text-[9px] uppercase tracking-wider px-2 py-0.5">Shared</span>
                                        )}
                                    </div>
                                </div>

                                <p className="text-text-secondary text-xs line-clamp-3 leading-[1.8] tracking-wide mb-6">
                                    {note.content || 'No additional content...'}
                                </p>

                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-border-primary/30">
                                    <div className="flex items-center gap-3 text-text-muted text-[10px] font-bold  tracking-tight">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 opacity-60" />
                                            {formatDate(note.updated_at)}
                                        </div>
                                        {note.collaborators && note.collaborators.length > 0 && (
                                            <div className="flex items-center gap-1.5" title={`${note.collaborators.length} collaborator(s)`}>
                                                <Users className="w-3 h-3 text-brand-secondary/80" />
                                                {note.collaborators.length}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {(isOwner(note) || user?.role === 'ADMIN') && (
                                            <button
                                                className="p-2 text-text-muted/40 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                onClick={(e) => handleDelete(note.id, e)}
                                                id={`delete-note-${note.id}`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <div className="p-2 text-brand-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </main>

            {/* Create Note Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-bg-primary/60 backdrop-blur-md"
                            onClick={() => setShowCreateModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">Create New Note</h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate}>
                                <div className="space-y-4">
                                    <div className="group">
                                        <label htmlFor="new-note-title" className="block text-sm font-semibold text-text-secondary mb-1.5 ml-1">Title</label>
                                        <input
                                            id="new-note-title"
                                            type="text"
                                            className="glass-input h-12"
                                            placeholder="My awesome note..."
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-8">
                                    <button
                                        type="button"
                                        className="btn-secondary flex-1"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                                        disabled={creating || !newTitle.trim()}
                                        id="create-note-submit"
                                    >
                                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 stroke-[2.5]" /> Create</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardPage;
