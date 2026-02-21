import api from './axios';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    created_at: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export const authApi = {
    register: (name: string, email: string, password: string) =>
        api.post<AuthResponse>('/auth/register', { name, email, password }),

    login: (email: string, password: string) =>
        api.post<AuthResponse>('/auth/login', { email, password }),

    me: () => api.get<{ user: User }>('/auth/me'),
};
