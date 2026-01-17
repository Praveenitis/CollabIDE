import { io, Socket } from 'socket.io-client';

// Get API base URL from environment or fallback to current origin
export const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || window.location.origin;
};

// Socket.io client instance
// Use environment variable for backend URL, fallback to current origin for local dev
const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const socket: Socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

// Socket event types
export interface User {
  id: string;
  name: string;
  color: string;
  avatar?: string;
}

export interface Session {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  files: Record<string, { content: string; cursors: Record<string, any> }>;
  collaborators: User[];
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export interface CursorPosition {
  lineNumber: number;
  column: number;
  selectionStartLineNumber?: number;
  selectionStartColumn?: number;
}

// Socket event handlers
export const socketEvents = {
  // Connection events
  connect: () => console.log('Connected to server'),
  disconnect: () => console.log('Disconnected from server'),
  
  // Session events
  'session-state': (session: Session) => console.log('Session state received:', session),
  'user-joined': (user: User) => console.log('User joined:', user),
  'user-left': (user: User) => console.log('User left:', user),
  
  // Code collaboration events
  'code-updated': (data: { fileId: string; content: string; cursor: CursorPosition & { userId: string } }) => 
    console.log('Code updated:', data),
  'cursor-updated': (data: { fileId: string; cursor: CursorPosition & { userId: string } }) => 
    console.log('Cursor updated:', data),
  
  // Chat events
  'chat-message': (message: ChatMessage) => console.log('Chat message:', message),
  
  // File operation events
  'file-operation': (data: { operation: string; fileData: any }) => console.log('File operation:', data),
  
  // Error events
  error: (error: { message: string }) => console.error('Socket error:', error)
};

// Initialize socket event listeners
Object.entries(socketEvents).forEach(([event, handler]) => {
  socket.on(event, handler);
});

// Socket utility functions
export const socketUtils = {
  // Connect to server
  connect: () => {
    if (!socket.connected) {
      socket.connect();
    }
  },
  
  // Disconnect from server
  disconnect: () => {
    if (socket.connected) {
      socket.disconnect();
    }
  },
  
  // Join a collaboration session
  joinSession: (sessionId: string, user: User) => {
    socket.emit('join-session', { sessionId, user });
  },
  
  // Leave current session
  leaveSession: () => {
    if (socket.sessionId) {
      socket.leave(socket.sessionId);
      socket.sessionId = undefined;
      socket.user = undefined;
    }
  },
  
  // Send code changes
  sendCodeChange: (sessionId: string, fileId: string, content: string, cursor: CursorPosition) => {
    socket.emit('code-change', { sessionId, fileId, content, cursor });
  },
  
  // Send cursor position updates
  sendCursorMove: (sessionId: string, fileId: string, cursor: CursorPosition) => {
    socket.emit('cursor-move', { sessionId, fileId, cursor });
  },
  
  // Send chat messages
  sendChatMessage: (sessionId: string, message: string) => {
    socket.emit('chat-message', { sessionId, message });
  },
  
  // File operations
  createFile: (sessionId: string, fileData: { id: string; name: string }) => {
    socket.emit('file-operation', { sessionId, operation: 'create', fileData });
  },
  
  deleteFile: (sessionId: string, fileData: { id: string }) => {
    socket.emit('file-operation', { sessionId, operation: 'delete', fileData });
  },
  
  renameFile: (sessionId: string, fileData: { oldId: string; newId: string; name: string }) => {
    socket.emit('file-operation', { sessionId, operation: 'rename', fileData });
  }
};

export default socket; 