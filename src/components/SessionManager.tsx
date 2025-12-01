import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Play, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Session, User, socketUtils } from '@/lib/socket';

interface SessionManagerProps {
  onSessionJoin: (session: Session, user: User) => void;
  currentUser: User;
}

export const SessionManager = ({ onSessionJoin, currentUser }: SessionManagerProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSession, setNewSession] = useState({ name: '', description: '' });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch sessions on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      // Use relative URL so it works both in Docker (nginx proxy) and dev
      const response = await fetch('/api/sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async () => {
    if (!newSession.name.trim()) {
      toast.error('Session name is required');
      return;
    }

    setIsCreating(true);
    try {
      // Use relative URL so it works both in Docker (nginx proxy) and dev
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      });

      if (!response.ok) throw new Error('Failed to create session');

      const session = await response.json();
      setSessions(prev => [session, ...prev]);
      setNewSession({ name: '', description: '' });
      toast.success('Session created successfully!');
      
      // Auto-join the created session
      joinSession(session, currentUser);
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create session');
    } finally {
      setIsCreating(false);
    }
  };

  const joinSession = async (session: Session, user: User) => {
    try {
      // Connect to socket if not connected
      socketUtils.connect();
      
      // Join the session
      socketUtils.joinSession(session.id, user);
      
      // Notify parent component
      onSessionJoin(session, user);
      
      toast.success(`Joined session: ${session.name}`);
    } catch (error) {
      console.error('Failed to join session:', error);
      toast.error('Failed to join session');
    }
  };

  const copySessionLink = (sessionId: string) => {
    const link = `${window.location.origin}?session=${sessionId}`;
    navigator.clipboard.writeText(link);
    toast.success('Session link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Collaborative Sessions</h2>
          <p className="text-muted-foreground">Join existing sessions or create a new one</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Session</DialogTitle>
              <DialogDescription>
                Create a new collaborative coding session for your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Session Name</label>
                <Input
                  placeholder="My Awesome Project"
                  value={newSession.name}
                  onChange={(e) => setNewSession(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Textarea
                  placeholder="Describe what you'll be working on..."
                  value={newSession.description}
                  onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <Button 
                onClick={createSession} 
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? 'Creating...' : 'Create Session'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sessions List */}
      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-32">
              <Users className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No sessions found</p>
              <p className="text-sm text-muted-foreground">Create the first session to get started!</p>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{session.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {session.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Users className="mr-1 h-3 w-3" />
                      {session.collaborators.length}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copySessionLink(session.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                  <Button
                    onClick={() => joinSession(session, currentUser)}
                    size="sm"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Join Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}; 