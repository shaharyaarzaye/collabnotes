import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { disconnectSocket } from '../sockets/socket';
import { motion } from 'framer-motion';
import { LogOut, NotebookTabs, User, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

const Navbar: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { isDarkMode, toggleTheme } = useThemeStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        disconnectSocket();
        logout();
        navigate('/login');
    };

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-50 bg-bg-secondary/85 backdrop-blur-xl border-b border-border-primary/50 py-3"
            id="main-navbar"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <Link to="/dashboard" className="flex items-center gap-2.5 group transition-transform active:scale-95">
                    <div className="relative overflow-hidden w-9 h-9 rounded-xl flex items-center justify-center bg-linear-to-br from-brand-primary to-brand-secondary shadow-lg shadow-brand-primary/20">
                        <NotebookTabs className="w-5 h-5 text-white" />
                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-white/20 blur-sm transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </div>
                    <span className="text-xl font-bold tracking-tight bg-linear-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                        CollabNotes
                    </span>
                </Link>

                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="hidden sm:flex flex-col items-end gap-0.5 max-w-[150px]">
                        <span className="text-sm font-semibold text-text-primary leading-none truncate w-full text-right">{user?.name}</span>
                        <span className="text-[11px] font-medium text-text-muted leading-none truncate w-full text-right">{user?.email}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all duration-200 active:scale-95"
                            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            <motion.div
                                initial={false}
                                animate={{ rotate: isDarkMode ? 0 : 180 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                            >
                                {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </motion.div>
                        </button>

                        <button
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all duration-200 active:scale-95"
                            onClick={handleLogout}
                            id="logout-btn"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden xs:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
