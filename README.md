# CollabNotes - Real-Time Collaborative Zen Notes

A premium, production-ready full-stack web application designed for focused writing and real-time collaboration. Built with a "Zen" aesthetic, featuring a dynamic design system that adapts to your environment.

---

## ✨ Premium Features

- **Zen Writing Environment**: A distraction-free editor with a optimized document widths, and air-tight typography.
- **Dynamic Theme System**: Full light and dark mode support with automatic persistence and smooth transitions.
- **Real-Time Collaboration**: Simultaneous editing with live presence indicators and automatic "Syncing" status.
- **Smart Scrollbars**: Intelligent scrollbars that remain hidden while you write, appearing only when you need them.
- **Full-Screen Focus**: Navigation-aware layout that hides redundant UI elements when you're in the "Flow" of writing.
- **Activity Tracking**: Comprehensive audit logs for every note, tracking edits, shares, and collaborator joins.
- **Global Search**: Instant, high-performance search across titles and content.

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        Frontend                                  │
│  React + TypeScript + Vite + Tailwind 4 + Zustand + Socket.io    │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐         │
│  │  Auth   │ │Dashboard │ │ Zen Editor│ │ Public View  │         │
│  │  Pages  │ │  Page    │ │   Page    │ │    Page      │         │
│  └─────────┘ └──────────┘ └───────────┘ └──────────────┘         │
│              Zustand (Global State & Theme)                      │
│              Framer Motion (Premium Animations)                  │
│              Socket.io-client (Real-time Sync)                   │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTP/WS
┌──────────────────────┴─────────────────────────────────────────┐
│                        Backend                                 │
│  Node.js + Express + TypeScript + Socket.io                    │
│  ┌──────────┐ ┌──────────────┐ ┌───────────────────────────┐   │
│  │Auth API  │ │  Notes API   │ │    Socket.io Server       │   │
│  │(JWT+bcrypt)│ │(CRUD+Search) │ │(Real-time Collaboration)│   │
│  └──────────┘ └──────────────┘ └───────────────────────────┘   │
│  ┌───────────────┐ ┌──────────────┐                            │
│  │Auth Middleware│ │ Prisma ORM   │                            │
│  └───────────────┘ └──────┬───────┘                            │
└──────────────────────────┬─────────────────────────────────────┘
                           │
                   ┌───────┴───────┐
                   │  PostgreSQL   │
                   └───────────────┘
```

---

## 🛠️ Tech Stack

| Layer     | Technology                   |
| --------- | ---------------------------- |
| Frontend  | React 18, TypeScript, Vite   |
| Styling   | Tailwind CSS 4, Lucide Icons |
| Animation | Framer Motion                |
| State     | Zustand (Auth, Notes, Theme) |
| HTTP      | Axios (with JWT interceptor) |
| Real-time | Socket.io-client             |
| Backend   | Node.js, Express, TypeScript |
| ORM       | Prisma                       |
| Auth      | JWT + bcrypt                 |
| Database  | PostgreSQL                   |

---

## 📊 Database Schema

### User
| Field         | Type     | Constraints         |
| ------------- | -------- | ------------------- |
| id            | UUID     | Primary Key         |
| email         | String   | Unique, Indexed     |
| password_hash | String   |                     |
| role          | Enum     | ADMIN/EDITOR/VIEWER |
| created_at    | DateTime | Default: now()      |

### Note
| Field              | Type     | Constraints        |
| ------------------ | -------- | ------------------ |
| id                 | UUID     | Primary Key        |
| title              | String   | Indexed            |
| content            | String   | Default: ""        |
| owner_id           | UUID     | FK → User, Indexed |
| created_at         | DateTime | Default: now()     |
| updated_at         | DateTime | Auto-updated       |
| public_share_token | String?  | Unique, Indexed    |

### Collaborator
| Field      | Type | Constraints        |
| ---------- | ---- | ------------------ |
| id         | UUID | Primary Key        |
| note_id    | UUID | FK → Note, Indexed |
| user_id    | UUID | FK → User, Indexed |
| permission | Enum | EDITOR/VIEWER      |

### ActivityLog
| Field     | Type     | Constraints                |
| --------- | -------- | -------------------------- |
| id        | UUID     | Primary Key                |
| user_id   | UUID     | FK → User, Indexed         |
| note_id   | UUID     | FK → Note, Indexed         |
| action    | Enum     | CREATE/UPDATE/DELETE/SHARE |
| timestamp | DateTime | Default: now(), Indexed    |

---

## 📡 API Documentation

### Authentication

| Method | Endpoint           | Auth | Description       |
| ------ | ------------------ | ---- | ----------------- |
| POST   | /api/auth/register | ❌    | Register new user |
| POST   | /api/auth/login    | ❌    | Login user        |
| GET    | /api/auth/me       | ✅    | Get current user  |

### Notes

| Method | Endpoint                          | Auth | Description         |
| ------ | --------------------------------- | ---- | ------------------- |
| POST   | /api/notes                        | ✅    | Create note         |
| GET    | /api/notes                        | ✅    | List user's notes   |
| GET    | /api/notes/:id                    | ✅    | Get note by ID      |
| PUT    | /api/notes/:id                    | ✅    | Update note         |
| DELETE | /api/notes/:id                    | ✅    | Delete note         |
| GET    | /api/notes/search?q=term          | ✅    | Search notes        |
| POST   | /api/notes/:id/share              | ✅    | Generate share link |
| POST   | /api/notes/:id/collaborators      | ✅    | Add collaborator    |
| DELETE | /api/notes/:id/collaborators/:uid | ✅    | Remove collaborator |
| GET    | /api/notes/:id/activity           | ✅    | Get activity log    |

---

## ⚡ Real-Time Collaboration

- Uses Socket.io with JWT authentication
- Room-based: `note:{noteId}`
- **Conflict Resolution**: Last Write Wins (uses `updated_at`)
- **Presence**: Real-time "Currently Editing" avatars and joining/leaving notifications.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/collab_notes?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
PORT=4000
FRONTEND_URL="http://localhost:5173"
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

---

## 🚀 Running Locally

### 1. Prerequisites
- Node.js 18+ & PostgreSQL 14+

### 2. Setup Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
├── backend/                        # Express + Prisma + Socket.io Server
│   ├── prisma/
│   │   └── schema.prisma           # Database Schema & Models
│   ├── src/
│   │   ├── controllers/            # Request Handlers (Auth, Notes)
│   │   ├── lib/                    # Shared Clients (Prisma)
│   │   ├── middleware/             # Role-based JWT Auth
│   │   ├── routes/                 # API Endpoint Definitions
│   │   ├── sockets/                # Real-time Collaboration logic
│   │   └── index.ts                # Server Entry Point
│   └── tsconfig.json               # Backend TS Config
│
└── frontend/                       # React + Tailwind 4 + Framer Motion
    ├── src/
    │   ├── api/                    # Axios Instances & API calls
    │   ├── components/             # Reusable UI Components
    │   ├── hooks/                  # Custom React Hooks
    │   ├── pages/                  # Main View Components
    │   ├── sockets/                # Client-side Socket handlers
    │   ├── store/                  # Zustand Global State
    │   ├── App.tsx                 # Root & Theme Interceptor
    │   ├── index.css               # Design System & Scrollbars
    │   └── main.tsx                # Frontend Entry Point
    └── vite.config.ts              # Vite Bundler Config
```

---
