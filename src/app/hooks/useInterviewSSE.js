import { useEffect, useMemo, useRef, useState } from 'react';
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

  // 콜백들을 ref로 관리하여 변경 시 SSE 재연결 방지
  const callbacksRef = useRef({ onOpen, onError, onQuestion, onFeedback, onEnd });
  callbacksRef.current = { onOpen, onError, onQuestion, onFeedback, onEnd };

  const url = useMemo(() => {
    if (!interviewId) return null;
    return `${API_CONFIG.BASE_URL}/interviews/${interviewId}/stream`;
  }, [interviewId]);

  useEffect(() => {
    if (!url) return undefined;

    const client = new SSEClient(url, {
      onOpen: () => {
        setIsConnected(true);
        callbacksRef.current.onOpen?.();
      },
      onError: (error) => {
        setIsConnected(false);
        callbacksRef.current.onError?.(error);
      },
    });

    client.addEventListener('question', (data) => {
      callbacksRef.current.onQuestion?.(data);
    });
    client.addEventListener('feedback', (data) => {
      callbacksRef.current.onFeedback?.(data);
    });
    client.addEventListener('end', (data) => {
      callbacksRef.current.onEnd?.(data);
    });

    client.connect();

    return () => client.close();
  }, [url]);

  return { isConnected };
}
