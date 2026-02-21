import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { authRouter } from './routes/auth.routes';
import { noteRouter } from './routes/note.routes';
import { publicRouter } from './routes/public.routes';
import { setupSocket } from './sockets/socket';

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/notes', noteRouter);
app.use('/api/public', publicRouter);

// Socket.io setup
const io = new SocketServer(server, {
    cors: corsOptions,
});

setupSocket(io);

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready`);
});

export { app, server, io };
