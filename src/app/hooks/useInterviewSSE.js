import { useEffect, useMemo, useState } from 'react';
import { SSEClient } from '@/app/api/sseClient';
import { API_CONFIG } from '@/app/api/config';

/**
 * Interview SSE hook
 * Events:
 * - question: { turnNo, question, askedAt }
 * - feedback: { totalFeedback }
 * - end: { message }
 */
export function useInterviewSSE(interviewId, options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const { onOpen, onError, onQuestion, onFeedback, onEnd } = options;

  const url = useMemo(() => {
    if (!interviewId) return null;
    return `${API_CONFIG.BASE_URL}/interviews/${interviewId}/stream`;
  }, [interviewId]);

  useEffect(() => {
    if (!url) return undefined;

    const client = new SSEClient(url, {
      onOpen: () => {
        setIsConnected(true);
        onOpen?.();
      },
      onError: (error) => {
        setIsConnected(false);
        onError?.(error);
      },
    });

    if (onQuestion) {
      client.addEventListener('question', onQuestion);
    }
    if (onFeedback) {
      client.addEventListener('feedback', onFeedback);
    }
    if (onEnd) {
      client.addEventListener('end', onEnd);
    }

    client.connect();

    return () => client.close();
  }, [url, onOpen, onError, onQuestion, onFeedback, onEnd]);

  return { isConnected };
}
