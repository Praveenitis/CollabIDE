# 🚀 Collaborative IDE Setup Guide

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Redis** (for session management)
3. **Git** (for version control)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Redis

**Option A: Using Docker (Recommended)**
```bash
docker run -d -p 6379:6379 redis:alpine
```

**Option B: Install Redis locally**
- **Windows**: Download from https://redis.io/download
- **macOS**: `brew install redis && brew services start redis`
- **Linux**: `sudo apt-get install redis-server`

### 3. Start the Development Servers

```bash
# Start both frontend and backend
npm run dev:full

# Or start them separately:
# Terminal 1: Backend server
npm run server

# Terminal 2: Frontend development server
npm run dev
```

### 4. Open Your Browser

Navigate to `http://localhost:5173` to access the collaborative IDE.

## Features

✅ **Real-time Code Collaboration**
- Live code editing with Monaco Editor
- Cursor position sharing
- Real-time syntax highlighting

✅ **Session Management**
- Create and join coding sessions
- Share session links
- Session persistence with Redis

✅ **Team Communication**
- Real-time chat during coding
- User presence indicators
- Collaborative user list

✅ **File Management**
- File explorer with tree structure
- Multiple language support
- File operations (create, delete, rename)

✅ **Modern UI/UX**
- Resizable panels
- Dark theme
- Responsive design
- Shadcn/ui components

## Project Structure

```
placement-ace-perntainer/
├── src/
│   ├── components/
│   │   ├── CodeEditor.tsx          # Main code editor with collaboration
│   │   ├── FileExplorer.tsx        # File tree explorer
│   │   ├── IDEHeader.tsx           # IDE header with session info
│   │   ├── SessionManager.tsx      # Session creation/joining
│   │   ├── CollaborativeChat.tsx   # Real-time chat
│   │   └── ui/                     # Shadcn/ui components
│   ├── lib/
│   │   └── socket.ts               # Socket.io client configuration
│   ├── pages/
│   │   └── Index.tsx               # Main application page
│   └── App.tsx                     # App root component
├── server/
│   └── index.js                    # Express + Socket.io server
└── package.json
```

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Code Editor**: Monaco Editor (VS Code's editor)
- **Real-time**: Socket.io
- **Backend**: Express.js + Node.js
- **Session Storage**: Redis
- **Build Tool**: Vite

## Development

### Adding New Features

1. **Backend**: Add new Socket.io events in `server/index.js`
2. **Frontend**: Update socket handlers in `src/lib/socket.ts`
3. **UI**: Create new components in `src/components/`

### Environment Variables

Create a `.env` file in the root directory:

```env
REDIS_URL=redis://localhost:6379
PORT=3001
```

## Deployment

### Backend Deployment

1. Deploy the `server/` directory to your hosting provider
2. Set up Redis (Redis Cloud, AWS ElastiCache, etc.)
3. Configure environment variables

### Frontend Deployment

1. Build the project: `npm run build`
2. Deploy the `dist/` folder to your hosting provider
3. Update the Socket.io server URL in `src/lib/socket.ts`

## Troubleshooting

### Common Issues

1. **Redis Connection Error**
   - Ensure Redis is running on port 6379
   - Check Redis connection string

2. **Socket.io Connection Issues**
   - Verify backend server is running on port 3001
   - Check CORS configuration

3. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run lint`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own collaborative coding needs! 