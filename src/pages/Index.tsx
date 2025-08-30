import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { LandingPage } from '@/components/LandingPage';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

const ChatApp = () => {
  const { user, loading } = useAuth();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const createNewSession = async () => {
    if (!user) return;

    const newSessionId = uuidv4();
    try {
      await supabase
        .from('chat_sessions')
        .insert({
          id: newSessionId,
          user_id: user.id,
          title: 'New Chat'
        });
      
      setCurrentSessionId(newSessionId);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleUpdateSessionTitle = (sessionId: string, title: string) => {
    // Title update is handled in ChatInterface
  };

  useEffect(() => {
    if (user && !currentSessionId) {
      createNewSession();
    }
  }, [user, currentSessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="h-screen flex bg-background">
      <ChatSidebar
        onSelectSession={handleSelectSession}
        onNewChat={createNewSession}
        onOpenSettings={() => {}}
        currentSessionId={currentSessionId || undefined}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col">
        {currentSessionId ? (
          <ChatInterface
            sessionId={currentSessionId}
            onUpdateSessionTitle={handleUpdateSessionTitle}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Welcome to AI Credit Card Advisor</h2>
              <p className="text-muted-foreground">Create a new chat to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <ChatApp />
    </AuthProvider>
  );
};

export default Index;
