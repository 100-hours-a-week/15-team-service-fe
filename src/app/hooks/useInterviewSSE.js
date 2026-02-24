import { useEffect, useRef, useCallback, useState } from 'react';
import { API_CONFIG } from '@/app/api/config';

const MAX_RETRY_COUNT = 5;
const INITIAL_RETRY_DELAY = 1000; // 1초
const MAX_RETRY_DELAY = 30000; // 30초

/**
 * SSE hook for receiving real-time interview events with auto-reconnect
 * @param {number|string} interviewId - Interview ID
 * @param {Object} callbacks - Event callbacks
 * @param {Function} callbacks.onQuestion - Called when a new question arrives
 * @param {Function} callbacks.onFeedback - Called when feedback arrives
 * @param {Function} callbacks.onEnd - Called when interview ends
 * @param {Function} callbacks.onError - Called on connection error
 * @returns {Object} - { isConnected, connectionState, connect, disconnect, retryCount }
 */
export function useInterviewSSE(interviewId, { onQuestion, onFeedback, onEnd, onError }) {
  const eventSourceRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected'); // 'connecting', 'connected', 'reconnecting', 'failed', 'disconnected'
  const [retryCount, setRetryCount] = useState(0);
  const isManualDisconnectRef = useRef(false);
  const isEndedRef = useRef(false);

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;
    clearRetryTimeout();
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setConnectionState('disconnected');
    setRetryCount(0);
  }, [clearRetryTimeout]);

  const connect = useCallback(() => {
    if (!interviewId) return;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    isManualDisconnectRef.current = false;
    isEndedRef.current = false;
    setConnectionState('connecting');

    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INTERVIEW_STREAM(interviewId)}`;

    const eventSource = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setConnectionState('connected');
      setRetryCount(0);
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
        isEndedRef.current = true;
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

      // 수동 종료 또는 면접 종료 시 재연결 안함
      if (isManualDisconnectRef.current || isEndedRef.current) {
        return;
      }

      // 재연결 시도
      setRetryCount((prev) => {
        const newCount = prev + 1;

        if (newCount > MAX_RETRY_COUNT) {
          setConnectionState('failed');
          onError?.(new Error('최대 재연결 시도 횟수를 초과했습니다.'));
          return prev;
        }

        setConnectionState('reconnecting');

        // 지수 백오프: 1초, 2초, 4초, 8초, 16초 (최대 30초)
        const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, prev), MAX_RETRY_DELAY);

        clearRetryTimeout();
        retryTimeoutRef.current = setTimeout(() => {
          if (!isManualDisconnectRef.current && !isEndedRef.current) {
            connect();
          }
        }, delay);

        return newCount;
      });
    };
  }, [interviewId, onQuestion, onFeedback, onEnd, onError, disconnect, clearRetryTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isManualDisconnectRef.current = true;
      clearRetryTimeout();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [clearRetryTimeout]);

  return { isConnected, connectionState, connect, disconnect, retryCount };
}
