import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Settings, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onOpenSettings: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
}

export const ChatInput = ({ 
  onSendMessage, 
  onOpenSettings, 
  disabled, 
  isGenerating,
  onStopGeneration 
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about credit cards..."
            disabled={disabled}
            className="min-h-[60px] max-h-[200px] resize-none pr-12"
            rows={1}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            className="absolute right-2 bottom-2 h-8 w-8 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        {isGenerating ? (
          <Button
            onClick={onStopGeneration}
            variant="destructive"
            size="lg"
            className="h-[60px] px-6"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || disabled}
            size="lg"
            className="h-[60px] px-6"
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        )}
      </div>
    </div>
  );
};