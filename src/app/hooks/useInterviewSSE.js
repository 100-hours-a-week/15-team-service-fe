import { useEffect, useRef, useCallback, useState } from 'react';
import { API_CONFIG } from '@/app/api/config';

/**
 * SSE hook for receiving real-time interview events
 * @param {number|string} interviewId - Interview ID
 * @param {Object} callbacks - Event callbacks
 * @param {Function} callbacks.onQuestion - Called when a new question arrives
 * @param {Function} callbacks.onFeedback - Called when feedback arrives
 * @param {Function} callbacks.onEnd - Called when interview ends
 * @param {Function} callbacks.onError - Called on connection error
 * @returns {Object} - { isConnected, connect, disconnect }
 */
export function useInterviewSSE(interviewId, { onQuestion, onFeedback, onEnd, onError }) {
  const eventSourceRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!interviewId || eventSourceRef.current) return;

    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INTERVIEW_STREAM(interviewId)}`;

    const eventSource = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.addEventListener('question', (event) => {
      try {
        const data = JSON.parse(event.data);
        onQuestion?.(data);
      } catch (e) {
        console.error('Failed to parse question event:', e);
      }
    });

    eventSource.addEventListener('feedback', (event) => {
      try {
        const data = JSON.parse(event.data);
        onFeedback?.(data);
      } catch (e) {
        console.error('Failed to parse feedback event:', e);
      }
    });

    eventSource.addEventListener('end', (event) => {
      try {
        const data = JSON.parse(event.data);
        onEnd?.(data);
        disconnect();
      } catch (e) {
        console.error('Failed to parse end event:', e);
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setIsConnected(false);
      onError?.(error);
    };
  }, [interviewId, onQuestion, onFeedback, onEnd, onError]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { isConnected, connect, disconnect };
}
