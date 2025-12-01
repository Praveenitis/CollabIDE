import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Users, MessageCircle } from 'lucide-react';
import { ChatMessage, User, socket, socketUtils } from '@/lib/socket';
import { formatDistanceToNow } from 'date-fns';

interface CollaborativeChatProps {
  sessionId: string;
  currentUser: User;
  collaborators: User[];
  messages: ChatMessage[];
  onMessageReceived: (message: ChatMessage) => void;
}

export const CollaborativeChat = ({ 
  sessionId, 
  currentUser, 
  collaborators, 
  messages, 
  onMessageReceived 
}: CollaborativeChatProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Listen for incoming chat messages
    const handleChatMessage = (message: ChatMessage) => {
      console.log('Chat component received message:', message);
      onMessageReceived(message);
    };

    socket.on('chat-message', handleChatMessage);

    return () => {
      socket.off('chat-message', handleChatMessage);
    };
  }, [onMessageReceived]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    // Send via socket
    socketUtils.sendChatMessage(sessionId, newMessage.trim());
    
    // Add to local messages immediately for instant feedback
    onMessageReceived(message);
    
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMessageTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'just now';
    }
  };

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Chat Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <h3 className="font-semibold">Team Chat</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            <Users className="mr-1 h-3 w-3" />
            {collaborators.length}
          </Badge>
        </div>
        
        {/* Online Collaborators */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Online:</span>
          <div className="flex gap-1">
            {collaborators.map((user) => (
              <div key={user.id} className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: user.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {user.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.userId === currentUser.id;
              const user = collaborators.find(u => u.id === message.userId);
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback 
                      className="text-xs"
                      style={{ 
                        backgroundColor: user?.color || '#6b7280',
                        color: 'white'
                      }}
                    >
                      {getInitials(message.userName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex-1 max-w-[80%] ${isOwnMessage ? 'text-right' : ''}`}>
                    <div className={`inline-block p-3 rounded-lg ${
                      isOwnMessage 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm">{message.message}</p>
                    </div>
                    <div className={`mt-1 text-xs text-muted-foreground ${
                      isOwnMessage ? 'text-right' : ''
                    }`}>
                      {message.userName} • {getMessageTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}; 