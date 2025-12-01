import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Session, User as UserType } from '@/lib/socket';
import { toast } from 'sonner';
import { Code, Link2, LogOut, Users } from 'lucide-react';

interface IDEHeaderProps {
  session?: Session;
  currentUser?: UserType;
  onLeaveSession?: () => void;
}

export const IDEHeader = ({ session, currentUser, onLeaveSession }: IDEHeaderProps) => {
  const sessionName = session?.name || 'Untitled session';

  const handleCopyLink = () => {
    if (!session) return;
    const link = `${window.location.origin}?session=${session.id}`;
    navigator.clipboard.writeText(link);
    toast.success('Session link copied to clipboard');
  };

  return (
    <header className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950/95 shadow-sm">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Brand + session name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 ring-1 ring-sky-500/40">
              <Code className="h-4 w-4 text-sky-400" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-slate-50">
                CollabIDE
              </p>
              <p className="text-xs text-slate-400">{sessionName}</p>
            </div>
          </div>

          {session && (
            <Badge className="hidden items-center gap-1 border-slate-700/80 bg-slate-900/80 text-[11px] text-slate-200 sm:inline-flex">
              <Users className="h-3 w-3" />
              {session.collaborators.length} active
            </Badge>
          )}
        </div>

        {/* Right: user + actions */}
        <div className="flex items-center gap-2">
          {currentUser && (
            <div className="hidden items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1 text-xs text-slate-100 sm:flex">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: currentUser.color }}
              />
              <span className="font-medium">{currentUser.name}</span>
            </div>
          )}

          {session && (
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700/80 bg-slate-900/70 text-xs text-slate-100 hover:bg-slate-800"
              onClick={handleCopyLink}
            >
              <Link2 className="mr-1 h-3 w-3" />
              Copy link
            </Button>
          )}

          {onLeaveSession && (
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:bg-slate-800"
              onClick={onLeaveSession}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};