import { useState } from 'react';
import { Copy, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from './MarkdownRenderer';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    type: 'user' | 'assistant';
    created_at: string;
  };
  isBookmarked?: boolean;
  onToggleBookmark?: (messageId: string) => void;
}

export const ChatMessage = ({ message, isBookmarked, onToggleBookmark }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const isUser = message.type === 'user';

  return (
    <div 
      className={cn(
        "flex w-full mb-4 group",
        isUser ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={cn(
        "relative max-w-[80%] rounded-lg p-4 shadow-sm",
        isUser 
          ? "bg-primary text-primary-foreground ml-12" 
          : "bg-muted text-muted-foreground mr-12"
      )}>
        {/* Message content */}
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
        <div className="prose prose-slate prose-sm max-w-none">
        <MarkdownRenderer content={message.content} />
        </div>
      )}

        {/* Action buttons */}
        <div className={cn(
          "absolute top-2 flex gap-1 transition-opacity duration-200",
          isUser ? "left-2" : "right-2",
          showActions ? "opacity-100" : "opacity-0"
        )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-8 w-8 p-0 bg-background/80 hover:bg-background"
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          
          {onToggleBookmark && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleBookmark(message.id)}
              className={cn(
                "h-8 w-8 p-0 bg-background/80 hover:bg-background",
                isBookmarked && "text-primary"
              )}
            >
              <Star className={cn("h-3 w-3", isBookmarked && "fill-current")} />
            </Button>
          )}
        </div>

        {/* Timestamp */}
        <div className={cn(
          "text-xs mt-2 opacity-60",
          isUser ? "text-right" : "text-left"
        )}>
          {new Date(message.created_at).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};