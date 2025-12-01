import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite dev server
    methods: ["GET", "POST"]
  }
});

// Redis client for session management
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

// Try to connect to Redis, but fall back to in-memory storage if unavailable.
let redisAvailable = false;
(async () => {
  try {
    await redisClient.connect();
    redisAvailable = true;
    console.log('Connected to Redis');
  } catch (err) {
    redisAvailable = false;
    console.log('Redis not available, falling back to in-memory storage');
    console.log(err && err.message ? err.message : err);
  }
})();

// Helper functions to use Redis if available, otherwise use in-memory maps
async function getAllSessions() {
  if (redisAvailable) {
    const sessions = await redisClient.hGetAll('sessions');
    return Object.keys(sessions).map(id => ({ id, ...JSON.parse(sessions[id]) }));
  }
  return Array.from(activeSessions.values());
}

async function getSessionById(sessionId) {
  if (redisAvailable) {
    const sessionData = await redisClient.hGet('sessions', sessionId);
    return sessionData ? JSON.parse(sessionData) : null;
  }
  return activeSessions.get(sessionId) || null;
}

async function saveSession(sessionId, session) {
  if (redisAvailable) {
    await redisClient.hSet('sessions', sessionId, JSON.stringify(session));
  } else {
    activeSessions.set(sessionId, session);
  }
}

// In-memory storage for active sessions (fallback)
const activeSessions = new Map();
const userSessions = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// REST API Routes
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await getAllSessions();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const { name, description } = req.body;
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      name: name || 'Untitled Session',
      description: description || '',
      createdAt: new Date().toISOString(),
      files: {},
      collaborators: []
    };
    await saveSession(sessionId, session);

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getSessionById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a collaboration session
  socket.on('join-session', async (data) => {
    const { sessionId, user } = data;
    
    try {
      // Get session (Redis or in-memory)
      const session = await getSessionById(sessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }
      
      // Add user to session
      socket.join(sessionId);
      socket.sessionId = sessionId;  // doubts
      socket.user = user;
      
      // Update session with new collaborator
      if (!session.collaborators.find(c => c.id === user.id)) {
        session.collaborators.push(user);
        await saveSession(sessionId, session);
      }
      
      // Notify others in the session
      socket.to(sessionId).emit('user-joined', user);
      
      // Send current session state to the new user
      socket.emit('session-state', session);
      
      console.log(`User ${user.name} joined session ${sessionId}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  // Handle code changes
  socket.on('code-change', async (data) => {
    const { sessionId, fileId, content, cursor } = data;
    
    try {
      // Get current session
      const session = await getSessionById(sessionId);
      if (!session) return;
      
      // Update file content
      if (!session.files[fileId]) {
        session.files[fileId] = { content: '', cursors: {} };
      }
      session.files[fileId].content = content;
      session.files[fileId].cursors[socket.user.id] = cursor;
      
  // Save session
  await saveSession(sessionId, session);
      
      // Broadcast to other users in the session
      socket.to(sessionId).emit('code-updated', {
        fileId,
        content,
        cursor: { userId: socket.user.id, ...cursor }
      });
    } catch (error) {
      console.error('Error handling code change:', error);
    }
  });

  // Handle cursor position updates
  socket.on('cursor-move', (data) => {
    const { sessionId, fileId, cursor } = data;
    socket.to(sessionId).emit('cursor-updated', {
      fileId,
      cursor: { userId: socket.user.id, ...cursor }
    });
  });

  // Handle chat messages
  socket.on('chat-message', async (data) => {
    const { sessionId, message } = data;
    
    try {
      const session = await getSessionById(sessionId);
      if (!session) return;
      
      // Add message to session
      if (!session.messages) session.messages = [];
      session.messages.push({
        id: uuidv4(),
        userId: socket.user.id,
        userName: socket.user.name,
        message,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 100 messages
      if (session.messages.length > 100) {
        session.messages = session.messages.slice(-100);
      }
      
  await saveSession(sessionId, session);
      
      // Broadcast to all users in session
      io.to(sessionId).emit('chat-message', {
        userId: socket.user.id,
        userName: socket.user.name,
        message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error handling chat message:', error);
    }
  });

  // Handle file operations
  socket.on('file-operation', async (data) => {
    const { sessionId, operation, fileData } = data;
    
    try {
      const session = await getSessionById(sessionId);
      if (!session) return;
      
      switch (operation) {
        case 'create':
          session.files[fileData.id] = { content: '', cursors: {} };
          break;
        case 'delete':
          delete session.files[fileData.id];
          break;
        case 'rename':
          if (session.files[fileData.oldId]) {
            session.files[fileData.newId] = session.files[fileData.oldId];
            delete session.files[fileData.oldId];
          }
          break;
      }
      
  await saveSession(sessionId, session);
      
      // Broadcast to other users
      socket.to(sessionId).emit('file-operation', { operation, fileData });
    } catch (error) {
      console.error('Error handling file operation:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.sessionId && socket.user) {
      try {
        // Remove user from session
        const session = await getSessionById(socket.sessionId);
        if (session) {
          session.collaborators = session.collaborators.filter(c => c.id !== socket.user.id);
          await saveSession(socket.sessionId, session);
        }
        
        // Notify other users
        socket.to(socket.sessionId).emit('user-left', socket.user);
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    }
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server ready for real-time collaboration`);
}); 