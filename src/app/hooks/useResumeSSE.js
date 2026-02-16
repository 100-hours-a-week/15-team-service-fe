import { useState, useEffect, useRef } from 'react';
import { SSEClient } from '@/app/api/sseClient';
import { API_CONFIG } from '@/app/api/config';

/**
 * SSE hook for resume editing events
 * @param {number | null} resumeId - Resume ID to subscribe to (null = no subscription)
 * @param {Object} options
 * @param {Function} options.onEditComplete - Callback for resume-edit-complete event
 * @returns {{ isConnected: boolean }}
 */
export function useResumeSSE(resumeId, options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef(null);
  const { onEditComplete } = options;

  // Prevent stale closure - store latest callback in ref
  const onEditCompleteRef = useRef(onEditComplete);
  useEffect(() => {
    onEditCompleteRef.current = onEditComplete;
  }, [onEditComplete]);

  useEffect(() => {
    if (!resumeId) {
      setIsConnected(false);
      return;
    }

    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RESUME_SSE_STREAM(resumeId)}`;

    const client = new SSEClient(url, {
      onOpen: () => {
        setIsConnected(true);
      },
      onError: (error) => {
        console.error('[useResumeSSE] SSE connection error:', error);
        setIsConnected(false);
      },
    });

    // Listen for resume-edit-complete events
    client.addEventListener('resume-edit-complete', (eventData) => {
      onEditCompleteRef.current?.(eventData);
    });

    client.connect();
    clientRef.current = client;

    // Cleanup on unmount or resumeId change
    return () => {
      client.close();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [resumeId]);

  return { isConnected };
}
