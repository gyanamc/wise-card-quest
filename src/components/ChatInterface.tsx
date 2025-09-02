import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Download, Trash2, Edit2, Check, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SettingsModal } from './SettingsModal';
import { useChatApi } from '@/hooks/useChatApi';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  created_at: string;
  session_id: string;
}

interface SettingsData {
  systemPrompt: string;
  webhookUrl: string;
  authToken: string;
  maxHistory: number;
  requestTimeout: number;
  theme: 'light' | 'dark' | 'auto';
}

interface ChatInterfaceProps {
  sessionId: string;
  onUpdateSessionTitle: (sessionId: string, title: string) => void;
}

const defaultSettings: SettingsData = {
  systemPrompt: `You are a helpful, agentic AI financial advisor specializing in credit cards. Your goal is to ask clarifying questions to understand the user's spending habits, credit score, and goals (rewards, travel, cashback, building credit) and then provide a personalized, ranked list of recommendations. Always use Markdown for formatting (tables for comparisons, lists for features). Never ask for PII like phone numbers.`,
  webhookUrl: 'https://primary-production-da3f.up.railway.app/webhook/gyanam.store',
  authToken: '',
  maxHistory: 10,
  requestTimeout: 30000,
  theme: 'auto'
};

export const ChatInterface = ({ sessionId, onUpdateSessionTitle }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionTitle, setSessionTitle] = useState('New Chat');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false);

  const { sendMessage, stopGeneration, isLoading } = useChatApi({
    webhookUrl: settings.webhookUrl,
    authToken: settings.authToken,
    systemPrompt: settings.systemPrompt,
    maxHistory: settings.maxHistory,
    requestTimeout: settings.requestTimeout,
    userId: user?.id
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('chatSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const handleSaveSettings = (newSettings: SettingsData) => {
    setSettings(newSettings);
    localStorage.setItem('chatSettings', JSON.stringify(newSettings));
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };

  // Load messages for current session
  useEffect(() => {
    loadMessages();
    loadBookmarks();
  }, [sessionId, user]);

  const loadMessages = async () => {
    if (!user || !sessionId) return;
    try {
      setLoading(true);
      
      // Load session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('title')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') {
        throw sessionError;
      }

      if (sessionData) {
        setSessionTitle(sessionData.title);
      }

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      setMessages((messagesData || []).map(msg => ({
        ...msg,
        type: msg.type as 'user' | 'assistant'
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('message_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const bookmarkedIds = new Set(data?.map(b => b.message_id) || []);
      setBookmarkedMessages(bookmarkedIds);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const saveMessage = async (content: string, type: 'user' | 'assistant') => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          content,
          type
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  };

  const updateSessionTitle = async (newTitle: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .upsert({
          id: sessionId,
          user_id: user.id,
          title: newTitle,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSessionTitle(newTitle);
      onUpdateSessionTitle(sessionId, newTitle);
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!user) return;
    try {
      // Save user message
      const userMessage = await saveMessage(content, 'user');
      if (!userMessage) throw new Error('Failed to save user message');

      // Update local state immediately
      setMessages(prev => [...prev, { ...userMessage, type: userMessage.type as 'user' | 'assistant' }]);

      // Auto-generate title for new sessions
      if (messages.length === 0) {
        const title = content.length > 50 ? content.substring(0, 50) + '...' : content;
        updateSessionTitle(title);
      }

      // Send to AI
      const response = await sendMessage(content, sessionId, messages);
      
      // Append AI response locally (do not save to Supabase)
      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          content: response.answer,
          type: 'assistant',
          created_at: new Date().toISOString(),
          session_id: sessionId
        }
      ]);

      // Update session timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', user.id);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleToggleBookmark = async (messageId: string) => {
    if (!user) return;
    try {
      const isBookmarked = bookmarkedMessages.has(messageId);
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('message_id', messageId);

        if (error) throw error;

        setBookmarkedMessages(prev => {
          const next = new Set(prev);
          next.delete(messageId);
          return next;
        });

        toast({
          title: "Bookmark removed",
          description: "Message has been removed from bookmarks.",
        });
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            message_id: messageId
          });

        if (error) throw error;

        setBookmarkedMessages(prev => new Set([...prev, messageId]));
        toast({
          title: "Bookmark added",
          description: "Message has been added to bookmarks.",
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to update bookmark.",
        variant: "destructive"
      });
    }
  };

  const handleClearChat = async () => {
    if (!user || !confirm('Are you sure you want to clear this chat? This action cannot be undone.')) return;
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setMessages([]);
      toast({
        title: "Chat cleared",
        description: "All messages have been removed from this chat.",
      });
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast({
        title: "Error",
        description: "Failed to clear chat.",
        variant: "destructive"
      });
    }
  };

  const handleExportChat = () => {
    const chatContent = messages.map(msg => 
      `[${new Date(msg.created_at).toLocaleString()}] ${msg.type.toUpperCase()}: ${msg.content}`
    ).join('\n\n');

    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${sessionTitle}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Chat exported",
      description: "Chat has been downloaded as a text file.",
    });
  };

  const handleEditTitle = () => {
    setEditingTitle(sessionTitle);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (editingTitle.trim()) {
      updateSessionTitle(editingTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  // Auto-scroll to bottom on message updates, skip on initial load
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    // Only auto-scroll if user is near bottom
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Left Sidebar */}
      <div className="sidebar">
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <h1 className="font-bold text-lg">AI Credit Advisor</h1>
          <Button 
            className="w-full mt-4" 
            onClick={() => window.location.href = '/chat'}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          
          <div className="mt-4">
            <Input
              placeholder="Search conversations..."
              className="w-full"
            />
          </div>
        </div>

        {/* Scrollable Chat History */}
        <div className="sidebar-history">
          <div className="px-4 space-y-1">
            <div className="p-3 rounded-lg bg-muted">
              <div className="font-medium truncate">Current Chat</div>
              <div className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Section */}
        <div className="sidebar-footer">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="font-medium text-sm truncate">{user?.email}</span>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="chat-area">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    className="text-lg font-semibold"
                  />
                  <Button size="sm" onClick={handleSaveTitle}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <h2 className="text-lg font-semibold truncate">{sessionTitle}</h2>
                  <Button size="sm" variant="ghost" onClick={handleEditTitle}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportChat}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearChat}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Messages */}
        <div className="chat-messages">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold mb-4">Welcome to AI Credit Card Advisor</h2>
                <p className="text-muted-foreground mb-8">
                  Ask me about credit cards, rewards, or building credit. I'll help you find the perfect card for your needs.
                </p>
                <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left justify-start"
                    onClick={() => handleSendMessage("I'm looking for a credit card with good travel rewards. Can you help me find one?")}
                  >
                    <div>
                      <div className="font-medium">Travel Rewards</div>
                      <div className="text-sm text-muted-foreground">Find cards with great travel benefits</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left justify-start"
                    onClick={() => handleSendMessage("I want to build my credit score. What's the best starter credit card?")}
                  >
                    <div>
                      <div className="font-medium">Build Credit</div>
                      <div className="text-sm text-muted-foreground">Get started with credit building</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left justify-start"
                    onClick={() => handleSendMessage("I want maximum cashback on my everyday purchases. What are my options?")}
                  >
                    <div>
                      <div className="font-medium">Cashback Cards</div>
                      <div className="text-sm text-muted-foreground">Maximize rewards on daily spending</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left justify-start"
                    onClick={() => handleSendMessage("I have excellent credit. What are the best premium credit cards available?")}
                  >
                    <div>
                      <div className="font-medium">Premium Cards</div>
                      <div className="text-sm text-muted-foreground">Explore elite credit card options</div>
                    </div>
                  </Button>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isBookmarked={bookmarkedMessages.has(message.id)}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-4 mr-12">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Fixed Input */}
        <div className="chat-input-fixed">
          <ChatInput
            onSendMessage={handleSendMessage}
            onOpenSettings={() => setSettingsOpen(true)}
            disabled={isLoading}
            isGenerating={isLoading}
            onStopGeneration={stopGeneration}
          />
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
};
