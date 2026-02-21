import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotesStore } from '../store/notesStore';
import { useAuthStore } from '../store/authStore';
import { useSocketNote } from '../hooks/useSocketNote';
import { notesApi } from '../api/notes';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, History, Users, Share2, Trash2, Check,
    Copy, X, Mail, Shield, Plus, Loader2, Sparkles,
    Edit3, Trash, Link as LinkIcon, Eye, Clock, User, FileText
} from 'lucide-react';

const NoteEditorPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const { currentNote, permission, isLoading, fetchNote, updateNote, setCurrentNote } = useNotesStore();
    const { sendUpdate } = useSocketNote({ noteId: id });

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);
    const [showCollabModal, setShowCollabModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [shareToken, setShareToken] = useState<string | null>(null);
    const [collabEmail, setCollabEmail] = useState('');
    const [collabPermission, setCollabPermission] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
    const [activities, setActivities] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Lock body scroll when any modal is open
    useEffect(() => {
        const anyModalOpen = showShareModal || showCollabModal || showActivityModal;
        if (anyModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showShareModal, showCollabModal, showActivityModal]);

    useEffect(() => {
        if (id) {
            fetchNote(id).catch((error: any) => {
                toast.error(error.response?.data?.error || 'Note not found');
                navigate('/dashboard');
            });
        }
        return () => {
            setCurrentNote(null);
        };
    }, [id, fetchNote, navigate, setCurrentNote]);

    useEffect(() => {
        if (currentNote) {
            setTitle(currentNote.title);
            setContent(currentNote.content);
            setShareToken(currentNote.public_share_token);
        }
    }, [currentNote]);

    const canEdit = permission === 'OWNER' || permission === 'EDITOR' || user?.role === 'ADMIN';
    const canDelete = permission === 'OWNER' || user?.role === 'ADMIN';
    const canShare = permission === 'OWNER' || permission === 'EDITOR' || user?.role === 'ADMIN';

    const handleTitleChange = useCallback((newTitle: string) => {
        setTitle(newTitle);
        sendUpdate({ title: newTitle });

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setSaving(true);
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await updateNote(id!, { title: newTitle });
                setSaving(false);
            } catch {
                setSaving(false);
            }
        }, 1000);
    }, [id, sendUpdate, updateNote]);

    const handleContentChange = useCallback((newContent: string) => {
        setContent(newContent);
        sendUpdate({ content: newContent });

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setSaving(true);
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await updateNote(id!, { content: newContent });
                setSaving(false);
            } catch {
                setSaving(false);
            }
        }, 1000);
    }, [id, sendUpdate, updateNote]);

    const handleShare = async () => {
        try {
            const { data } = await notesApi.share(id!);
            setShareToken(data.token);
            setShowShareModal(true);
            toast.success('Share link generated!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to share');
        }
    };

    const handleAddCollaborator = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await notesApi.addCollaborator(id!, collabEmail, collabPermission);
            toast.success(`Added ${collabEmail} as ${collabPermission}`);
            setCollabEmail('');
            fetchNote(id!);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to add collaborator');
        }
    };

    const handleRemoveCollaborator = async (userId: string) => {
        try {
            await notesApi.removeCollaborator(id!, userId);
            toast.success('Collaborator removed');
            fetchNote(id!);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to remove collaborator');
        }
    };

    const loadActivity = async () => {
        try {
            const { data } = await notesApi.getActivity(id!);
            setActivities(data.logs);
            setShowActivityModal(true);
        } catch (error: any) {
            toast.error('Failed to load activity');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this note?')) return;
        try {
            const { deleteNote } = useNotesStore.getState();
            await deleteNote(id!);
            toast.success('Note deleted');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete');
        }
    };

    const copyShareLink = () => {
        const url = `${window.location.origin}/public/${shareToken}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'CREATE': return <Sparkles className="w-4 h-4 text-yellow-400" />;
            case 'UPDATE': return <Edit3 className="w-4 h-4 text-blue-400" />;
            case 'DELETE': return <Trash className="w-4 h-4 text-red-400" />;
            case 'SHARE': return <LinkIcon className="w-4 h-4 text-purple-400" />;
            default: return <FileText className="w-4 h-4 text-gray-400" />;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg-primary text-text-primary">
                <Navbar />
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
                    <p className="text-text-muted font-medium animate-pulse">Fetching your thoughts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary font-sans overflow-x-hidden">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                {/* Minimal Floating Toolbar */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between gap-2 mb-8 glass-card bg-bg-primary/40! p-2 rounded-2xl sticky top-6 z-40 backdrop-blur-md border-border-primary/30 shadow-sm transition-all hover:shadow-lg hover:shadow-brand-primary/5"
                >
                    <div className="flex items-center gap-1">
                        <button
                            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-tertiary/50 rounded-xl transition-all"
                            onClick={() => navigate('/dashboard')}
                            id="back-btn"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-border-primary/30 mx-1" />
                        <div className="flex items-center gap-2 px-2 py-1">
                            {saving ? (
                                <div className="flex items-center gap-1.5 animate-pulse">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.15em]">Syncing</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <Check className="w-3 h-3 text-green-400" />
                                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-[0.15em]">Saved</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-tertiary/50 rounded-xl transition-all"
                            onClick={loadActivity}
                            title="History"
                            id="activity-btn"
                        >
                            <History className="w-4 h-4" />
                        </button>

                        {canShare && (
                            <div className="flex items-center gap-1 ml-1">
                                <button
                                    className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-tertiary/50 rounded-xl transition-all"
                                    onClick={() => setShowCollabModal(true)}
                                    title="Collaborators"
                                    id="collab-btn"
                                >
                                    <Users className="w-4 h-4" />
                                </button>
                                <button
                                    className="bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 border border-brand-primary/20"
                                    onClick={handleShare}
                                    id="share-btn"
                                >
                                    <Share2 className="w-3.5 h-3.5" />
                                    Share
                                </button>
                            </div>
                        )}

                        {canDelete && (
                            <div className="flex items-center gap-1 ml-1">
                                <div className="w-px h-4 bg-border-primary/30 mx-1" />
                                <button
                                    className="p-2 text-text-muted hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
                                    onClick={handleDelete}
                                    id="delete-btn"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Refined Editor Area */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative flex flex-col min-h-[80vh]"
                >
                    <div className="mb-2">
                        <textarea
                            className="w-full bg-transparent border-none outline-none text-3xl sm:text-4xl font-black text-text-primary placeholder:text-text-muted/10 mb-1 tracking-tight leading-tight focus:ring-0 p-0 selection:bg-brand-primary/30 resize-none h-auto min-h-[1em]"
                            value={title}
                            onChange={(e) => {
                                handleTitleChange(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onFocus={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            placeholder="A quiet title..."
                            disabled={!canEdit}
                            id="note-title-input"
                            rows={1}
                            autoFocus
                        />

                        <div className="flex items-center gap-4 text-[10px] font-bold text-text-muted/40 uppercase tracking-[0.15em]">
                            {currentNote?.owner && (
                                <div className="flex items-center gap-2 py-1">
                                    <div className="w-4 h-4 rounded-full bg-bg-tertiary border border-border-primary/40 flex items-center justify-center text-[7px] text-text-muted">
                                        {currentNote.owner.name.charAt(0)}
                                    </div>
                                    <span className="hover:text-text-muted transition-colors cursor-default">{currentNote.owner.name}</span>
                                </div>
                            )}
                            <div className="w-1 h-1 rounded-full bg-border-primary/30" />
                            <span>{permission}</span>
                            {currentNote?.updated_at && (
                                <>
                                    <div className="w-1 h-1 rounded-full bg-border-primary/30" />
                                    <span className="font-medium normal-case tracking-normal">
                                        Last saved {new Date(currentNote.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <textarea
                        className="w-full grow bg-transparent border-none outline-none resize-none text-lg font-reading text-text-secondary placeholder:text-text-muted/10 leading-[1.9] tracking-wide focus:ring-0 p-0 selection:bg-brand-primary/20 custom-scrollbar scroll-smooth"
                        value={content}
                        onChange={(e) => handleContentChange(e.target.value)}
                        placeholder={canEdit ? 'The blank page is yours. Start writing...' : 'Read-only mode.'}
                        disabled={!canEdit}
                        id="note-content-input"
                    />

                    {/* Minimal Collaborator Indicator */}
                    <AnimatePresence>
                        {currentNote?.collaborators && currentNote.collaborators.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.4 }}
                                whileHover={{ opacity: 1 }}
                                className="fixed bottom-8 right-8 flex items-center gap-2 p-2 bg-bg-secondary/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-sm transition-all cursor-crosshair group"
                                onClick={() => setShowCollabModal(true)}
                            >
                                <div className="flex -space-x-1.5">
                                    {currentNote.collaborators.map((c, i) => (
                                        <div
                                            key={c.id}
                                            className="w-5 h-5 rounded-full bg-bg-tertiary border border-bg-primary flex items-center justify-center text-[7px] font-black"
                                            title={c.user.name}
                                            style={{ zIndex: 10 - i }}
                                        >
                                            {c.user.name.charAt(0)}
                                        </div>
                                    ))}
                                </div>
                                <div className="p-1 rounded-md text-text-muted group-hover:text-brand-primary transition-colors">
                                    <Plus className="w-2.5 h-2.5" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </main>

            {/* Premium Modals */}
            <AnimatePresence>
                {/* Share Modal */}
                {showShareModal && shareToken && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-bg-primary/60 backdrop-blur-md"
                        onClick={() => setShowShareModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md glass-card rounded-3xl p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-purple-400/10 rounded-lg">
                                        <Share2 className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <h2 className="text-lg font-bold">Share publicly</h2>
                                </div>
                                <button onClick={() => setShowShareModal(false)} className="p-1 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-text-secondary text-xs mb-4 leading-relaxed">
                                Share this read-only link with anyone. They can view the content but won't be able to edit or see private details.
                            </p>

                            <div className="flex gap-2 p-1 bg-bg-tertiary/50 rounded-xl border border-border-primary mb-6 group">
                                <input
                                    type="text"
                                    className="grow bg-transparent border-none outline-none px-3 text-[11px] font-medium text-text-primary h-9 truncate"
                                    value={`${window.location.origin}/public/${shareToken}`}
                                    readOnly
                                    id="share-link-input"
                                />
                                <button
                                    className="btn-primary py-0 px-3 flex items-center gap-1.5 text-[10px] rounded-lg shrink-0 h-9"
                                    onClick={copyShareLink}
                                    id="copy-link-btn"
                                >
                                    <Copy className="w-3 h-3" />
                                    Copy
                                </button>
                            </div>

                            <button className="btn-secondary w-full py-2.5 text-sm" onClick={() => setShowShareModal(false)}>
                                Done
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {/* Collaborators Modal */}
                {showCollabModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-bg-primary/60 backdrop-blur-md"
                        onClick={() => setShowCollabModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg glass-card rounded-3xl p-6 max-h-[90vh] flex flex-col shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-brand-primary/10 rounded-lg">
                                        <Users className="w-4 h-4 text-brand-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold">Collaborators</h2>
                                        <p className="text-[10px] text-text-muted">Manage access for this note</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowCollabModal(false)} className="p-1 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Add Section */}
                            <div className="mb-6 pb-5 border-b border-border-primary/50">
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted mb-2.5 px-1">Invite Team Member</div>
                                <form onSubmit={handleAddCollaborator}>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="grow group relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-brand-primary transition-colors" />
                                            <input
                                                type="email"
                                                className="glass-input h-10 pl-9 text-xs"
                                                placeholder="colleague@example.com"
                                                value={collabEmail}
                                                onChange={(e) => setCollabEmail(e.target.value)}
                                                required
                                                id="collab-email-input"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <select
                                                className="glass-input h-10 text-xs px-3 min-w-[100px] cursor-pointer appearance-none bg-none pr-7"
                                                value={collabPermission}
                                                onChange={(e) => setCollabPermission(e.target.value as 'EDITOR' | 'VIEWER')}
                                                id="collab-permission-select"
                                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '0.9rem' }}
                                            >
                                                <option value="EDITOR">Editor</option>
                                                <option value="VIEWER">Viewer</option>
                                            </select>
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn-primary h-10 px-4 flex items-center justify-center gap-2 rounded-xl text-xs shrink-0"
                                            id="add-collab-btn"
                                        >
                                            <Plus className="w-3.5 h-3.5 stroke-3" />
                                            <span>Invite</span>
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* List Section */}
                            <div className="grow flex flex-col min-h-0">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted">Active Access</div>
                                    <span className="px-1.5 py-0.5 rounded bg-bg-tertiary text-[9px] font-bold text-text-muted">
                                        {(currentNote?.collaborators?.length || 0) + (currentNote?.owner ? 1 : 0)} People
                                    </span>
                                </div>

                                <div className="grow overflow-y-auto pr-1 custom-scrollbar">
                                    <div className="space-y-1.5">
                                        {/* Owner Entry */}
                                        {currentNote?.owner && (
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-primary/5 border border-brand-primary/10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-brand-primary/20">
                                                        {currentNote.owner.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-bold text-text-primary">{currentNote.owner.name}</span>
                                                            {user?.id === currentNote.owner.id && <span className="text-[8px] text-brand-primary font-black uppercase tracking-tighter">(You)</span>}
                                                        </div>
                                                        <div className="text-[10px] text-text-muted">{currentNote.owner.email}</div>
                                                    </div>
                                                </div>
                                                <span className="badge badge-owner text-[8px] px-1.5">Owner</span>
                                            </div>
                                        )}

                                        {/* Collaborators */}
                                        {currentNote?.collaborators && currentNote.collaborators.length > 0 ? (
                                            currentNote.collaborators.map((c) => (
                                                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary/20 border border-border-primary/40 group/item hover:border-brand-primary/20 hover:bg-bg-tertiary/40 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-bg-tertiary border border-border-primary flex items-center justify-center text-text-primary text-xs font-bold">
                                                            {c.user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs font-bold text-text-primary truncate max-w-[110px]">{c.user.name}</span>
                                                                {user?.id === c.user.id && <span className="text-[8px] text-brand-primary font-black uppercase tracking-tighter">(You)</span>}
                                                            </div>
                                                            <div className="text-[10px] text-text-muted truncate max-w-[140px]">{c.user.email}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`badge badge-${c.permission.toLowerCase()} text-[8px] px-1.5`}>
                                                            {c.permission}
                                                        </span>
                                                        {(permission === 'OWNER' || user?.role === 'ADMIN') && (
                                                            <button
                                                                className="p-1.5 text-text-muted hover:text-red-400 opacity-50 group-hover/item:opacity-100 transition-all hover:bg-red-400/10 rounded-lg"
                                                                onClick={() => handleRemoveCollaborator(c.user.id)}
                                                                title={`Remove ${c.user.name}`}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : !currentNote?.owner && (
                                            <div className="py-8 text-center rounded-2xl border-2 border-dashed border-border-primary/40">
                                                <div className="w-12 h-12 bg-bg-tertiary/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <Users className="w-6 h-6 text-text-muted opacity-50" />
                                                </div>
                                                <p className="text-text-secondary font-medium text-xs">No access logs found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-border-primary/50">
                                <button className="btn-secondary w-full py-2.5 text-sm" onClick={() => setShowCollabModal(false)} id="collab-close-btn">
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Activity Modal */}
                {showActivityModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-bg-primary/60 backdrop-blur-md"
                        onClick={() => setShowActivityModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg glass-card rounded-3xl p-6 max-h-[90vh] flex flex-col shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-blue-400/10 rounded-lg">
                                        <History className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold">Activity Log</h2>
                                        <p className="text-[10px] text-text-muted">Review the history of this note</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowActivityModal(false)} className="p-1 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grow overflow-y-auto pr-1 custom-scrollbar">
                                {activities.length === 0 ? (
                                    <div className="py-20 text-center">
                                        <p className="text-text-secondary text-sm">No history found for this note.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-0.5 relative">
                                        <div className="absolute left-6 top-0 bottom-0 w-px bg-border-primary/30" />
                                        {activities.map((log) => (
                                            <div key={log.id} className="relative flex gap-3 p-3 rounded-xl hover:bg-bg-tertiary/30 transition-colors group">
                                                <div className="shrink-0 w-5 h-5 rounded-full bg-bg-primary border border-border-primary flex items-center justify-center z-10 mt-0.5">
                                                    <div className="scale-75 origin-center">
                                                        {getActionIcon(log.action)}
                                                    </div>
                                                </div>
                                                <div className="grow">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-xs font-bold text-text-primary">{log.user.name}</span>
                                                        <span className="text-[9px] font-bold text-text-muted whitespace-nowrap bg-bg-tertiary px-1.5 py-0.5 rounded">
                                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-text-secondary leading-normal">
                                                        {log.action === 'CREATE' && 'created the note'}
                                                        {log.action === 'UPDATE' && 'updated the content'}
                                                        {log.action === 'DELETE' && 'deleted a portion'}
                                                        {log.action === 'SHARE' && 'generated a share link'}
                                                    </div>
                                                    <div className="text-[8px] text-text-muted/40 mt-1 uppercase font-black tracking-widest">
                                                        {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-border-primary/50">
                                <button className="btn-secondary w-full py-2.5 text-sm" onClick={() => setShowActivityModal(false)}>
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NoteEditorPage;
