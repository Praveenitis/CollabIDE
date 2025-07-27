import { useState } from 'react';
import { IDEHeader } from '@/components/IDEHeader';
import { FileExplorer } from '@/components/FileExplorer';
import { CodeEditor } from '@/components/CodeEditor';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  isOpen?: boolean;
}

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<FileNode>();

  return (
    <div className="h-screen flex flex-col bg-background">
      <IDEHeader />
      
      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
            <FileExplorer 
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={80}>
            <CodeEditor selectedFile={selectedFile} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Index;
