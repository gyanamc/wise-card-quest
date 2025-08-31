import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  created_at: string;
}

interface ChatApiResponse {
  answer: string;
  sources?: Array<{
    title: string;
    url: string;
  }>;
}

interface ChatApiError {
  error: {
    message: string;
    code: string;
  };
}

interface UseChatApiProps {
  webhookUrl: string;
  authToken?: string;
  systemPrompt: string;
  maxHistory: number;
  requestTimeout: number;
  userId?: string;
}

export const useChatApi = ({
  webhookUrl,
  authToken,
  systemPrompt,
  maxHistory,
  requestTimeout,
  userId
}: UseChatApiProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    sessionId: string,
    conversationHistory: ChatMessage[]
  ): Promise<ChatApiResponse> => {
    setIsLoading(true);
    
    // Create abort controller for this request
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Prepare conversation history (limit to maxHistory)
      const recentHistory = conversationHistory.slice(-maxHistory);
      
      // Build messages array with system prompt
      const messages = [
        { role: 'system', content: systemPrompt },
        ...recentHistory.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: message,
          sessionId: sessionId,
          userId: userId,
          session_id: sessionId, // Keep for backward compatibility
          messages,
          conversation_history: recentHistory
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: { 
            message: `HTTP ${response.status}: ${response.statusText}`, 
            code: response.status.toString() 
          } 
        }));
        throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
      }

      // Parse the array response and extract the HTML answer
      const arr = await response.json();
      console.log('Full response array:', arr);
      if (!Array.isArray(arr) || arr.length === 0) {
        throw new Error('Invalid response: expected an array');
      }
      const first = arr[0];
      console.log('First item:', first);
      console.log('HTML content length:', first.html?.length);
      console.log('HTML content:', first.html);
      if (typeof first.html !== 'string') {
        throw new Error('Invalid response: missing html field');
      }
      return {
        answer: first.html,
        sources: first.suggestedQuestions?.map(q => ({ title: q, url: '' })) || [],
      };

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request was cancelled');
      }
      
      // Handle timeout
      if (error.name === 'TimeoutError') {
        throw new Error('Request timed out');
      }
      
      // Re-throw with original message
      throw error;
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  }, [webhookUrl, authToken, systemPrompt, maxHistory, requestTimeout, userId]);

  const stopGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  }, [abortController]);

  return {
    sendMessage,
    stopGeneration,
    isLoading
  };
};
