import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NoteEditorPage from './pages/NoteEditorPage';
import PublicNotePage from './pages/PublicNotePage';
import { useThemeStore } from './store/themeStore';

const App: React.FC = () => {
    const loadUser = useAuthStore((s: any) => s.loadUser);
    const isAuthenticated = useAuthStore((s: any) => s.isAuthenticated);
    const isDarkMode = useThemeStore((s: any) => s.isDarkMode);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    return (
        <BrowserRouter>
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-primary)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontFamily: 'Inter, sans-serif',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: 'var(--bg-secondary)',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: 'var(--bg-secondary)',
                        },
                    },
                }}
            />
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
                } />
                <Route path="/register" element={
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
                } />
                <Route path="/public/:token" element={<PublicNotePage />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute><DashboardPage /></ProtectedRoute>
                } />
                <Route path="/notes/:id" element={
                    <ProtectedRoute><NoteEditorPage /></ProtectedRoute>
                } />

                {/* Default redirect */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
