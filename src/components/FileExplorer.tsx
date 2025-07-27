import { useState } from 'react';
import { Folder, File, Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
}

export const FileExplorer = ({ onFileSelect, selectedFile }: FileExplorerProps) => {
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
    if (newFileName.trim()) {
      const newFile: FileNode = {
        id: Date.now().toString(),
        name: newFileName,
        type: newFileName.includes('.') ? 'file' : 'folder',
        children: newFileName.includes('.') ? undefined : []
      };
      
      setFiles(prev => [...prev, newFile]);
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
    <div className="h-full bg-card border-r border-border">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Files</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreating(true)}
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>
      
      <div className="p-2">
        {isCreating && (
          <div className="mb-2">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="File/folder name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              autoFocus
            />
          </div>
        )}
        
        {renderFileTree(files)}
      </div>
    </div>
  );
};