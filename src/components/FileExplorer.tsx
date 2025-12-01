import { useState, useEffect } from 'react';
import { Folder, File, Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { socket, socketUtils } from '@/lib/socket';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isOpen?: boolean;
}

interface FileExplorerProps {
  onFileSelect: (file: FileNode) => void;
  selectedFile?: FileNode;
  sessionId?: string;
}

export const FileExplorer = ({ onFileSelect, selectedFile, sessionId }: FileExplorerProps) => {
  const [files, setFiles] = useState<FileNode[]>([
    {
      id: '1',
      name: 'src',
      type: 'folder',
      isOpen: true,
      children: [
        { id: '2', name: 'index.js', type: 'file' },
        { id: '3', name: 'App.js', type: 'file' }
      ]
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Listen for file operations from other users
  useEffect(() => {
    const handleFileOperation = (data: { operation: string; fileData: any }) => {
      console.log('File operation received:', data);
      
      switch (data.operation) {
        case 'create':
          const newFile: FileNode = {
            id: data.fileData.id,
            name: data.fileData.name,
            type: data.fileData.name.includes('.') ? 'file' : 'folder',
            children: data.fileData.name.includes('.') ? undefined : []
          };
          setFiles(prev => [...prev, newFile]);
          break;
          
        case 'delete':
          setFiles(prev => removeFileFromTree(prev, data.fileData.id));
          break;
          
        case 'rename':
          setFiles(prev => updateFileInTree(prev, data.fileData.oldId, {
            id: data.fileData.newId,
            name: data.fileData.name
          }));
          break;
      }
    };

    socket.on('file-operation', handleFileOperation);
    
    return () => {
      socket.off('file-operation', handleFileOperation);
    };
  }, []);

  const removeFileFromTree = (nodes: FileNode[], targetId: string): FileNode[] => {
    return nodes.filter(node => {
      if (node.id === targetId) return false;
      if (node.children) {
        node.children = removeFileFromTree(node.children, targetId);
      }
      return true;
    });
  };

  const updateFileInTree = (nodes: FileNode[], targetId: string, updates: Partial<FileNode>): FileNode[] => {
    return nodes.map(node => {
      if (node.id === targetId) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return { ...node, children: updateFileInTree(node.children, targetId, updates) };
      }
      return node;
    });
  };

  const toggleFolder = (folderId: string) => {
    setFiles(prev => updateFileTree(prev, folderId, node => ({
      ...node,
      isOpen: !node.isOpen
    })));
  };

  const updateFileTree = (nodes: FileNode[], targetId: string, updateFn: (node: FileNode) => FileNode): FileNode[] => {
    return nodes.map(node => {
      if (node.id === targetId) {
        return updateFn(node);
      }
      if (node.children) {
        return { ...node, children: updateFileTree(node.children, targetId, updateFn) };
      }
      return node;
    });
  };

  const handleCreateFile = () => {
    if (newFileName.trim() && sessionId) {
      const fileId = Date.now().toString();
      const newFile: FileNode = {
        id: fileId,
        name: newFileName,
        type: newFileName.includes('.') ? 'file' : 'folder',
        children: newFileName.includes('.') ? undefined : []
      };
      
      // Add to local state immediately
      setFiles(prev => [...prev, newFile]);
      
      // Emit to other users via socket
      socketUtils.createFile(sessionId, { id: fileId, name: newFileName });
      
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-2 py-1 hover:bg-accent cursor-pointer ${
            selectedFile?.id === node.id ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.id);
            } else {
              onFileSelect(node);
            }
          }}
        >
          {node.type === 'folder' ? (
            node.isOpen ? <FolderOpen size={16} /> : <Folder size={16} />
          ) : (
            <File size={16} />
          )}
          <span className="text-sm">{node.name}</span>
        </div>
        {node.type === 'folder' && node.isOpen && node.children && (
          <div>
            {renderFileTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <aside className="h-full border-r border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="border-b border-slate-800 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Explorer
            </h3>
            <p className="text-[10px] text-slate-500">Session workspace</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-300 hover:bg-slate-800"
            onClick={() => setIsCreating(true)}
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>

      <div className="p-2">
        {isCreating && (
          <div className="mb-2">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="New file or folder..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              autoFocus
              className="h-7 bg-slate-900/80 text-xs"
            />
          </div>
        )}

        {renderFileTree(files)}
      </div>
    </aside>
  );
};