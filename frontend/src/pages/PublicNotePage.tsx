import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { notesApi, Note } from '../api/notes';
import { motion, AnimatePresence } from 'framer-motion';
import {
    NotebookTabs, Eye, Lock, Clock, User,
    ArrowRight, Loader2, FileX, Sparkles
} from 'lucide-react';

const PublicNotePage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadNote = async () => {
            try {
                const { data } = await notesApi.getPublic(token!);
                setNote(data.note);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Note not found');
            } finally {
                setLoading(false);
            }
        };

        if (token) loadNote();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
                <p className="text-text-muted font-medium animate-pulse tracking-wide">Retrieving shared thought...</p>
            </div>
        );
    }

    if (error || !note) {
        return (
            <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full glass-card rounded-3xl p-10 text-center shadow-2xl"
                >
                    <div className="w-20 h-20 bg-red-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-black mb-3">Access Denied</h2>
                    <p className="text-text-secondary mb-8 leading-relaxed">
                        {error || 'This link may have expired or the note may no longer be shared with the public.'}
                    </p>
                    <Link
                        to="/login"
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2 rounded-xl group"
                    >
                        <span>Go to CollabNotes</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary font-sans">
            {/* Header Banner */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 glass-card bg-bg-primary/80 backdrop-blur-xl border-b border-border-primary/50"
            >
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-linear-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                            <NotebookTabs className="w-6 h-6" />
                        </div>
                        <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-linear-to-r from-text-primary to-text-secondary">CollabNotes</span>
                    </Link>
                    <div className="flex items-center gap-2 bg-blue-400/10 px-4 py-1.5 rounded-full border border-blue-400/20">
                        <Eye className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Read Only</span>
                    </div>
                </div>
            </motion.header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-[40px] p-8 sm:p-16 shadow-2xl relative overflow-hidden"
                >
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Sparkles className="w-32 h-32" />
                    </div>

                    <header className="mb-12 border-b border-border-primary/50 pb-8">
                        <h1 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight leading-tight">
                            {note.title || 'Untitled Note'}
                        </h1>
                        <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-text-muted">
                            {(note as any).owner && (
                                <div className="flex items-center gap-2 bg-brand-primary/5 px-3 py-1 rounded-full border border-brand-primary/10">
                                    <User className="w-4 h-4 text-brand-primary" />
                                    <span>{(note as any).owner.name || (note as any).owner.email}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>Updated {new Date(note.updated_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            </div>
                        </div>
                    </header>

                    <section className="prose prose-invert max-w-none">
                        <div className="text-lg sm:text-xl text-text-secondary leading-relaxed whitespace-pre-wrap">
                            {note.content || (
                                <div className="flex flex-col items-center py-20 text-text-muted grayscale opacity-50">
                                    <FileX className="w-16 h-16 mb-4" />
                                    <p className="font-medium italic">This shared note has no content yet.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <footer className="mt-20 pt-10 border-t border-border-primary/30 text-center">
                        <p className="text-sm text-text-muted mb-6">Want to create and share your own notes?</p>
                        <Link
                            to="/register"
                            className="btn-ghost inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-brand-primary font-bold hover:bg-brand-primary/5 transition-all"
                        >
                            <span>Join CollabNotes for free</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </footer>
                </motion.article>
            </main>
        </div>
    );
};

export default PublicNotePage;
