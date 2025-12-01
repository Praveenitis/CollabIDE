import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Play, Save, Users, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { socket, socketUtils, CursorPosition, User, ChatMessage } from '@/lib/socket';
import { CollaborativeChat } from './CollaborativeChat';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface CodeEditorProps {
  selectedFile?: FileNode;
  sessionId?: string;
  currentUser?: User;
  collaborators?: User[];
}

export const CodeEditor = ({ selectedFile, sessionId, currentUser, collaborators = [] }: CodeEditorProps) => {
  const [code, setCode] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, CursorPosition>>({});
  const editorRef = useRef<any>(null);

  // Real-time collaboration effects
  useEffect(() => {
    if (!sessionId) return;

    // Listen for code updates from other users
    const handleCodeUpdate = (data: { fileId: string; content: string; cursor: CursorPosition & { userId: string } }) => {
      if (selectedFile && data.fileId === selectedFile.id) {
        setCode(data.content);
        setRemoteCursors(prev => ({
          ...prev,
          [data.cursor.userId]: data.cursor
        }));
      }
    };

    // Listen for cursor updates
    const handleCursorUpdate = (data: { fileId: string; cursor: CursorPosition & { userId: string } }) => {
      if (selectedFile && data.fileId === selectedFile.id) {
        setRemoteCursors(prev => ({
          ...prev,
          [data.cursor.userId]: data.cursor
        }));
      }
    };

    // Listen for chat messages
    const handleChatMessage = (message: ChatMessage) => {
      console.log('Received chat message:', message);
      setMessages(prev => [...prev, message]);
    };

    socket.on('code-updated', handleCodeUpdate);
    socket.on('cursor-updated', handleCursorUpdate);
    socket.on('chat-message', handleChatMessage);

    return () => {
      socket.off('code-updated', handleCodeUpdate);
      socket.off('cursor-updated', handleCursorUpdate);
      socket.off('chat-message', handleChatMessage);
    };
  }, [sessionId, selectedFile]);

  // File content management
  useEffect(() => {
    if (selectedFile) {
      // In a real app, you'd fetch the file content from the session
      switch (selectedFile.name) {
        case 'index.js':
          setCode(`// Welcome to the Collaborative IDE
console.log("Hello, World!");

function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Developer"));`);
          break;
        case 'App.js':
          setCode(`import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>My React App</h1>
      <p>Built with collaborative IDE</p>
    </div>
  );
}

export default App;`);
          break;
        default:
          setCode(`// ${selectedFile.name}
// Start coding here...`);
      }
    } else {
      setCode('// Select a file to start editing');
    }
  }, [selectedFile]);

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving file:', selectedFile?.name);
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    
    // Send code changes to other users
    if (sessionId && selectedFile && currentUser) {
      const cursor = editorRef.current?.getPosition();
      if (cursor) {
        socketUtils.sendCodeChange(sessionId, selectedFile.id, newCode, cursor);
      }
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleCursorPositionChanged = () => {
    if (sessionId && selectedFile && currentUser && editorRef.current) {
      const cursor = editorRef.current.getPosition();
      socketUtils.sendCursorMove(sessionId, selectedFile.id, cursor);
    }
  };

  const handleMessageReceived = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'jsx': return 'javascript';
      case 'tsx': return 'typescript';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'cpp': case 'c++': return 'cpp';
      case 'c': return 'c';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'plaintext';
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setOutput('Executing...');
    
    // Simulate code execution
    setTimeout(() => {
      try {
        // Mock execution - in real implementation, this would be sent to backend
        const result = 'Hello, World!\nHello, Developer!';
        setOutput(result);
      } catch (error) {
        setOutput(`Error: ${error}`);
      }
      setIsExecuting(false);
    }, 1500);
  };

  if (!selectedFile) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 px-8 py-6 text-center shadow-xl shadow-sky-900/30 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-400/80">
            CollabIDE session
          </p>
          <h3 className="mt-3 text-xl font-semibold text-slate-50">
            No file selected
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Use the explorer on the left to open or create a file, then start coding together in real time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Editor Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="rounded-md border border-slate-700/80 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-200">
            {selectedFile.name}
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-slate-500" />
            <div className="flex gap-1">
              {collaborators.map(collaborator => (
                <Badge
                  key={collaborator.id}
                  variant="outline"
                  className="border-slate-700/80 bg-slate-900/70 text-[11px] text-slate-100"
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-1" 
                    style={{ backgroundColor: collaborator.color }}
                  />
                  {collaborator.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowChat(!showChat)}
            className="border-slate-700/80 bg-slate-900/80 text-xs text-slate-100 hover:bg-slate-800"
          >
            <MessageCircle size={16} className="mr-1" />
            Chat
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            className="border-slate-700/80 bg-slate-900/80 text-xs text-slate-100 hover:bg-slate-800"
          >
            <Save size={16} className="mr-1" />
            Save
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleExecute}
            disabled={isExecuting}
          >
            <Play size={16} className="mr-1" />
            {isExecuting ? 'Running...' : 'Run'}
          </Button>
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="flex-1 flex">
        <div className="flex-1">
          <Editor
            height="100%"
            language={getLanguageFromFileName(selectedFile.name)}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            onCursorPositionChanged={handleCursorPositionChanged}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on'
            }}
          />
        </div>
        
        {/* Output Panel */}
        <div className="w-80 border-l border-slate-800 bg-slate-950/80">
          <div className="border-b border-slate-800 px-3 py-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Output
            </h4>
          </div>
          <div className="p-3">
            <pre className="text-xs font-mono whitespace-pre-wrap text-slate-300">
              {output || 'Run your code to see output here...'}
            </pre>
          </div>
        </div>
        
        {/* Chat Panel */}
        {showChat && sessionId && currentUser && (
          <div className="w-80 border-l border-slate-800">
            <CollaborativeChat
              sessionId={sessionId}
              currentUser={currentUser}
              collaborators={collaborators}
              messages={messages}
              onMessageReceived={handleMessageReceived}
            />
          </div>
        )}
      </div>
    </div>
  );
};