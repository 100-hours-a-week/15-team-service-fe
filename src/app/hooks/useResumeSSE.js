import { useState, useEffect, useRef } from 'react';
import { SSEClient } from '@/app/api/sseClient';
import { API_CONFIG } from '@/app/api/config';

/**
 * SSE hook for resume editing events
 * @param {number | null} resumeId - Resume ID to subscribe to (null = no subscription)
 * @param {Object} options
 * @param {Function} options.onEditComplete - Callback for resume-edit-complete event
 * @param {Function} options.onEditFailed - Callback for resume-edit-failed event
 * @returns {{ isConnected: boolean }}
 */
export function useResumeSSE(resumeId, options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef(null);
  const { onEditComplete, onEditFailed } = options;

  // Prevent stale closure - store latest callback in ref
  // Direct assignment during render is safe: refs are mutable and always
  // reflect the latest callback when the SSE event fires asynchronously.
  const onEditCompleteRef = useRef(onEditComplete);
  const onEditFailedRef = useRef(onEditFailed);
  onEditCompleteRef.current = onEditComplete;
  onEditFailedRef.current = onEditFailed;

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
      onError: () => {
        setIsConnected(false);
      },
      closeOnError: true,
    });

    // Listen for resume-edit-complete events
    client.addEventListener('resume-edit-complete', (eventData) => {
      onEditCompleteRef.current?.(eventData);
    });

    client.addEventListener('resume-edit-failed', (eventData) => {
      onEditFailedRef.current?.(eventData);
    });

    client.connect();
    clientRef.current = client;

    const handleLogout = () => {
      client.close();
      clientRef.current = null;
      setIsConnected(false);
    };
    window.addEventListener('auth:logout', handleLogout);

    // Cleanup on unmount or resumeId change
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      client.close();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [resumeId]);

  return { isConnected };
}
