import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Loader2, NotebookTabs } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((s) => s.login);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-bg-primary">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-secondary/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md glass-card p-8 rounded-2xl relative z-10"
            >
                <div className="flex flex-col items-center mb-8 text-center">
                    <motion.div
                        initial={{ rotate: 15, scale: 0.8 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-16 h-16 rounded-2xl bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-2xl shadow-brand-primary/30 mb-4"
                    >
                        <NotebookTabs className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">Welcome back</h1>
                    <p className="text-text-secondary mt-2">Sign in to your CollabNotes account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                        <label className="block text-sm font-semibold text-text-secondary mb-1.5 ml-1">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-brand-primary transition-colors" />
                            <input
                                id="login-email"
                                type="email"
                                className="glass-input pl-11"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <label className="block text-sm font-semibold text-text-secondary mb-1.5 ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-brand-primary transition-colors" />
                            <input
                                id="login-password"
                                type="password"
                                className="glass-input pl-11"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        type="submit"
                        className="btn-primary w-full flex items-center justify-center gap-2 mt-2 h-[52px]"
                        disabled={loading}
                        id="login-submit"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                Sign in
                            </>
                        )}
                    </motion.button>
                </form>

                <p className="text-center text-text-secondary mt-8 text-sm">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-brand-primary font-bold hover:underline">Create one</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default LoginPage;
