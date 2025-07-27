import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Share2, 
  Settings, 
  User, 
  Code, 
  Terminal,
  GitBranch
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const IDEHeader = () => {
  return (
    <div className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
      {/* Left Section - Logo & Project */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Code className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">CollabIDE</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Input 
            defaultValue="my-awesome-project"
            className="w-40 h-8 text-sm"
          />
          <Badge variant="outline" className="gap-1">
            <GitBranch size={12} />
            main
          </Badge>
        </div>
      </div>

      {/* Center Section - Quick Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <Terminal size={16} className="mr-1" />
          Terminal
        </Button>
      </div>

      {/* Right Section - User & Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Share2 size={16} className="mr-1" />
          Share
        </Button>
        
        <Button variant="ghost" size="sm">
          <Settings size={16} />
        </Button>
        
        <Button variant="ghost" size="sm">
          <User size={16} />
        </Button>
      </div>
    </div>
  );
};