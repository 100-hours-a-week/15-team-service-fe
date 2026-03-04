import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_CONFIG } from '@/app/api/config';
import { fetchNotificationBadge } from '@/app/api/endpoints/notifications';

/** Global context so RootLayout can host the single SSE connection. */
export const NotificationContext = createContext({
  hasNew: false,
  clearBadge: () => {},
  isConnected: false,
});

/** Consume the SSE badge state provided by RootLayout. */
export const useNotificationContext = () => useContext(NotificationContext);

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

/**
 * SSE hook for real-time notifications from /notifications/stream.
 *
 * Unified stream — handles all SSE events:
 * - connected: { hasNew, latestId } → 초기 뱃지 설정
 * - notification: { id, type, payload, createdAt } → hasNew + toast + cache invalidate
 * - resume-refresh-required: { resumeId, versionNo, status } → dispatches sse:resume-refresh-required
 * - heartbeat: 무시
 *
 * All event.data payloads use the common wrapper:
 *   { eventType, occurredAt, data: { ... } }
 * so actual data is accessed via JSON.parse(event.data).data.
 *
 * @param {boolean} enabled
 * @returns {{ hasNew: boolean, clearBadge: Function, isConnected: boolean }}
 */
export function useNotificationSSE(enabled = true) {
  const [hasNew, setHasNew] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  const eventSourceRef = useRef(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    let destroyed = false;
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS_STREAM}`;

    function connect() {
      if (destroyed) return;

      const es = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => {
        retryCountRef.current = 0;
        setIsConnected(true);
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        setIsConnected(false);

        // SSE 실패 시 badge API로 hasNew 복구
        fetchNotificationBadge()
          .then((data) => {
            if (!destroyed) setHasNew(data.hasNew);
          })
          .catch(() => {});

        const delay =
          RETRY_DELAYS[
            Math.min(retryCountRef.current, RETRY_DELAYS.length - 1)
          ];
        retryCountRef.current += 1;
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        retryTimerRef.current = setTimeout(connect, delay);
      };

      es.addEventListener('connected', (event) => {
        try {
          const { data } = JSON.parse(event.data);
          setHasNew(data.hasNew);
        } catch {
          // Malformed — ignore
        }
      });

      es.addEventListener('notification', (event) => {
        try {
          const { data } = JSON.parse(event.data);
          setHasNew(true);
          window.dispatchEvent(
            new CustomEvent('notification-toast', {
              detail: {
                type: data.type,
                message: data.payload?.message ?? '새 알림이 도착했습니다.',
                payload: data.payload,
              },
            })
          );
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } catch {
          // Malformed — ignore
        }
      });

      es.addEventListener('resume-refresh-required', (event) => {
        try {
          const { data } = JSON.parse(event.data);
          window.dispatchEvent(
            new CustomEvent('sse:resume-refresh-required', { detail: data })
          );
        } catch {
          // Malformed — ignore
        }
      });

      // heartbeat: no listener needed
    }

    connect();

    const handleLogout = () => {
      destroyed = true;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setHasNew(false);
      setIsConnected(false);
    };
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      destroyed = true;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [enabled, queryClient]);

  const clearBadge = useCallback(() => setHasNew(false), []);

  return { hasNew, clearBadge, isConnected };
}
