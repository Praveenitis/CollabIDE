import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Play, Save, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface CodeEditorProps {
  selectedFile?: FileNode;
}

export const CodeEditor = ({ selectedFile }: CodeEditorProps) => {
  const [code, setCode] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState('');
  const [collaborators] = useState([
    { id: '1', name: 'John Doe', color: '#3b82f6' },
    { id: '2', name: 'Jane Smith', color: '#ef4444' }
  ]);

  // Mock file content based on selected file
  useEffect(() => {
    if (selectedFile) {
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
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <h3 className="text-lg font-semibold mb-2">Welcome to Collaborative IDE</h3>
          <p>Select a file from the explorer to start coding</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <span className="font-medium">{selectedFile.name}</span>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-muted-foreground" />
            <div className="flex gap-1">
              {collaborators.map(collaborator => (
                <Badge key={collaborator.id} variant="outline" className="text-xs">
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
          <Button variant="outline" size="sm" onClick={handleSave}>
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
            onChange={(value) => setCode(value || '')}
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
        <div className="w-80 border-l border-border bg-card">
          <div className="p-3 border-b border-border">
            <h4 className="font-semibold text-sm">Output</h4>
          </div>
          <div className="p-3">
            <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
              {output || 'Run your code to see output here...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};