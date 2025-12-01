# CollabIDE

CollabIDE is a real‑time collaborative code editor where multiple developers can join a session, work in the same files, and talk through changes without leaving the browser.

## Features

- **Live code sessions**: Create named sessions, invite others with a link, and see each other typing in real time.
- **Presence & cursors**: Each collaborator has their own color, so you can tell who is editing where.
- **Built‑in chat**: Keep the discussion next to the code with a simple real‑time chat sidebar.
- **File explorer**: Organise files in a tree, create new files, and switch between them quickly.
- **Modern editor**: Monaco (the VS Code editor) with syntax highlighting, multiple languages, and a dark theme.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Editor**: Monaco
- **Realtime layer**: Socket.io
- **Backend**: Node.js + Express
- **State / storage**: Redis (with an in‑memory fallback for local dev)

## Running the project locally

### Prerequisites

- Node.js 16 or newer
- Docker (for the easiest setup) or a local Redis instance

### Option 1 – Run everything with Docker

```bash
git clone <your-repo-url>
cd placement-ace-perntainer

# Build images and start frontend, backend and Redis
docker-compose up -d --build
```

Then open `http://localhost` in your browser.

### Option 2 – Run with Node + local Redis

```bash
git clone <your-repo-url>
cd placement-ace-perntainer
npm install
```

Start Redis (either via Docker or locally), for example:

```bash
docker run -d -p 6379:6379 redis:alpine
```

Then run the app:

```bash
npm run dev:full
```

Open `http://localhost:5173` in your browser.

## Environment variables

Create a `.env` file in the project root if you want to override defaults:

```env
REDIS_URL=redis://localhost:6379
PORT=3001
```

## High‑level structure

```text
src/
  components/
    CodeEditor.tsx        // Monaco editor with collaboration hooks
    FileExplorer.tsx      // Simple file tree panel
    IDEHeader.tsx         // Top bar with session info and actions
    SessionManager.tsx    // Session list + create/join flow
    CollaborativeChat.tsx // Chat panel for each session
    ui/                   // Shared UI primitives
  lib/
    socket.ts             // Socket.io client setup + helpers
  pages/
    Index.tsx             // Landing and main layout
  App.tsx

server/
  index.js                // Express + Socket.io + Redis integration
```

## Deployment notes

- The repository includes:
  - A `Dockerfile` for the frontend (Vite build served via nginx).
  - A `server/Dockerfile` for the Node/Express backend.
  - A `docker-compose.yml` that wires frontend, backend and Redis together.
- In practice you can:
  - Use `docker-compose` on a VM (or a Docker‑friendly PaaS) and point your domain at the frontend container.
  - Or deploy backend and frontend separately and configure `socket.ts` to point at your backend URL.

## License

MIT – feel free to experiment with it, extend it, or adapt it to your own workflow.
