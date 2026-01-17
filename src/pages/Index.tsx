import { useState, useEffect } from 'react';
import { IDEHeader } from '@/components/IDEHeader';
import { FileExplorer } from '@/components/FileExplorer';
import { CodeEditor } from '@/components/CodeEditor';
import { SessionManager } from '@/components/SessionManager';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Session, User, socketUtils, socket, getApiUrl } from '@/lib/socket';
import { v4 as uuidv4 } from 'uuid';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isOpen?: boolean;
}

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<FileNode>();
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User>(() => {
    // Generate a unique user for each browser tab
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
    
    // Use timestamp + random to ensure uniqueness
    const timestamp = Date.now();
    const randomIndex = Math.floor(Math.random() * names.length);
    const randomColorIndex = Math.floor(Math.random() * colors.length);
    
    return {
      id: `user_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      name: names[randomIndex],
      color: colors[randomColorIndex]
    };
  });

  // Check for session ID in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    
    if (sessionId) {
      // Auto-join session from URL
      const apiUrl = getApiUrl();
      fetch(`${apiUrl}/api/sessions/${sessionId}`)
        .then(res => res.json())
        .then(session => {
          setCurrentSession(session);
          // Connect to socket and join session
          socketUtils.connect();
          socketUtils.joinSession(sessionId, currentUser);
        })
        .catch(err => {
          console.error('Failed to join session from URL:', err);
          setError('Failed to join session');
        });
    }
  }, [currentUser]);

  const handleSessionJoin = (session: Session, user: User) => {
    setCurrentSession(session);
    setCurrentUser(user);
  };

  // Listen for session updates
  useEffect(() => {
    if (!currentSession) return;

    const handleUserJoined = (user: User) => {
      setCurrentSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          collaborators: [...prev.collaborators.filter(c => c.id !== user.id), user]
        };
      });
    };

    const handleUserLeft = (user: User) => {
      setCurrentSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          collaborators: prev.collaborators.filter(c => c.id !== user.id)
        };
      });
    };

    const handleSessionState = (session: Session) => {
      setCurrentSession(session);
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('session-state', handleSessionState);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('session-state', handleSessionState);
    };
  }, [currentSession]);

  const handleLeaveSession = () => {
    setCurrentSession(null);
    setSelectedFile(undefined);
  };

  // Show error if there is one
  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-red-600">Error</h1>
            <p className="text-xl text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show session manager if no active session
  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-10 lg:flex-row lg:items-center lg:justify-between">
          {/* Left hero copy */}
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-200 shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live collaborative coding
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Pair‑program in a
                <span className="bg-gradient-to-r from-sky-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
                  {" "}
                  shared IDE
                </span>
              </h1>
              <p className="text-base text-slate-300 sm:text-lg">
                Spin up a session, share a link, and code together in real‑time with cursor presence,
                live chat, and a familiar editor experience.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 shadow-sm backdrop-blur">
                <p className="font-semibold text-slate-100">Live sessions</p>
                <p className="mt-1 text-xs text-slate-400">Create rooms, invite your team, and stay in sync.</p>
              </div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 shadow-sm backdrop-blur">
                <p className="font-semibold text-slate-100">Code & chat</p>
                <p className="mt-1 text-xs text-slate-400">Discuss changes without leaving the editor.</p>
              </div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 shadow-sm backdrop-blur">
                <p className="font-semibold text-slate-100">Presence</p>
                <p className="mt-1 text-xs text-slate-400">See who&apos;s online and where they&apos;re editing.</p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Sessions are powered by Socket.io and Redis under the hood – you just click{" "}
              <span className="font-medium text-slate-200">New Session</span> and start coding.
            </p>
          </div>

          {/* Right: Session manager card */}
          <div className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-2xl shadow-sky-900/30 backdrop-blur">
            <SessionManager onSessionJoin={handleSessionJoin} currentUser={currentUser} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <IDEHeader 
        session={currentSession}
        currentUser={currentUser}
        onLeaveSession={handleLeaveSession}
      />
      
      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
            <FileExplorer 
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
              sessionId={currentSession.id}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={80}>
            <CodeEditor 
              selectedFile={selectedFile}
              sessionId={currentSession.id}
              currentUser={currentUser}
              collaborators={currentSession.collaborators}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Index;
