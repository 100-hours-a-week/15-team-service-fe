import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { useQueryClient } from '@tanstack/react-query';
import { API_CONFIG } from '@/app/api/config';

/**
 * STOMP WebSocket hook for chatroom real-time messaging.
 * Connection lifecycle tied to chatroomId — null means disconnected.
 * @param {number | null} chatroomId - Target chatroom ID, or null to disconnect.
 * @returns {{ sendMessage: (payload: object) => void, isConnected: boolean }}
 */
export function useChatWebSocket(chatroomId) {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatroomId) {
      setIsConnected(false);
      return;
    }

    let subscription = null;

    const client = new Client({
      brokerURL: API_CONFIG.WS_URL,
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        subscription = client.subscribe(
          `/topic/chats/${chatroomId}`,
          (message) => {
            try {
              const response = JSON.parse(message.body);
              if (response.code === 'SUCCESS' && response.data?.message) {
                const newMsg = response.data.message;
                queryClient.setQueryData(
                  ['chatMessages', chatroomId],
                  (oldData) => {
                    if (!oldData) return oldData;
                    const pages = [...oldData.pages];
                    const lastPage = pages[pages.length - 1];
                    pages[pages.length - 1] = {
                      ...lastPage,
                      chats: [...lastPage.chats, newMsg],
                    };
                    return { ...oldData, pages };
                  }
                );
                queryClient.invalidateQueries({ queryKey: ['chats'] });
              }
            } catch {
              // Malformed message — ignore
            }
          }
        );
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: () => {
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subscription?.unsubscribe();
      client.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [chatroomId, queryClient]);

  const sendMessage = useCallback(
    (payload) => {
      if (!clientRef.current?.connected) {
        throw new Error('WebSocket not connected');
      }
      clientRef.current.publish({
        destination: `/app/chats/${chatroomId}`,
        body: JSON.stringify(payload),
      });
    },
    [chatroomId]
  );

  return { sendMessage, isConnected };
}
