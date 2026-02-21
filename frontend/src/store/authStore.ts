import { create } from 'zustand';
import { authApi, User } from '../api/auth';

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    loadUser: () => Promise<void>;
    setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: localStorage.getItem('token'),
    isLoading: true,
    isAuthenticated: false,

    login: async (email: string, password: string) => {
        const { data } = await authApi.login(email, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
        });
    },

    register: async (name: string, email: string, password: string) => {
        const { data } = await authApi.register(name, email, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
        });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
            user: null,
            token: null,
            isAuthenticated: false,
        });
    },

    loadUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
        }

        try {
            const { data } = await authApi.me();
            set({
                user: data.user,
                token,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    },

    setUser: (user: User) => set({ user }),
}));
