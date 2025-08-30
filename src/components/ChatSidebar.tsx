import { useState, useEffect } from 'react';
import { Plus, Search, MessageSquare, Star, Settings, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface BookmarkedMessage {
  id: string;
  content: string;
  type: string;
  created_at: string;
  session_id: string;
}

interface ChatSidebarProps {
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  currentSessionId?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const ChatSidebar = ({
  onSelectSession,
  onNewChat,
  onOpenSettings,
  currentSessionId,
  isCollapsed,
  onToggleCollapse
}: ChatSidebarProps) => {
  const { user, signOut } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkedMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const loadSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          id,
          message_id,
          chat_messages (
            id,
            content,
            type,
            created_at,
            session_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const bookmarkedMessages = data?.map(bookmark => ({
        id: (bookmark.chat_messages as any).id,
        content: (bookmark.chat_messages as any).content,
        type: (bookmark.chat_messages as any).type,
        created_at: (bookmark.chat_messages as any).created_at,
        session_id: (bookmark.chat_messages as any).session_id,
      })) || [];
      
      setBookmarks(bookmarkedMessages);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadSessions();
      loadBookmarks();
    }
  }, [user]);

  const truncateTitle = (title: string, maxLength: number = 30) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-14 border-r border-border bg-sidebar flex flex-col">
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-full h-10 p-0"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col items-center gap-2 p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewChat}
            className="w-full h-10 p-0"
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            className="w-full h-10 p-0"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full h-10 p-0"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-border bg-sidebar flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sidebar-foreground">AI Credit Advisor</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 p-0"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        
        <Button onClick={onNewChat} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="chats" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="chats" className="flex-1">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chats
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="flex-1">
            <Star className="h-4 w-4 mr-2" />
            Bookmarks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="flex-1 mt-2">
          <ScrollArea className="h-full">
            <div className="p-2">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredSessions.map((session) => (
                    <Button
                      key={session.id}
                      variant="ghost"
                      onClick={() => onSelectSession(session.id)}
                      className={cn(
                        "w-full justify-start text-left h-auto p-3",
                        currentSessionId === session.id && "bg-sidebar-accent"
                      )}
                    >
                      <div className="flex-1 overflow-hidden">
                        <div className="font-medium text-sm truncate">
                          {truncateTitle(session.title)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(session.updated_at)}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="bookmarks" className="flex-1 mt-2">
          <ScrollArea className="h-full">
            <div className="p-2">
              {bookmarks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No bookmarks yet
                </div>
              ) : (
                <div className="space-y-2">
                  {bookmarks.map((bookmark) => (
                    <Button
                      key={bookmark.id}
                      variant="ghost"
                      onClick={() => onSelectSession(bookmark.session_id)}
                      className="w-full justify-start text-left h-auto p-3"
                    >
                      <div className="flex-1 overflow-hidden">
                        <div className="text-sm line-clamp-2">
                          {bookmark.content.substring(0, 100)}...
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(bookmark.created_at)}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-medium truncate">{user?.email}</div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="flex-1"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="flex-1"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};