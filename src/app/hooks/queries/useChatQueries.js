import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchChats, fetchChatMessages } from '@/app/api/endpoints/chats';

/**
 * Fetch all chatrooms
 * @returns {import('@tanstack/react-query').UseQueryResult<Array>}
 */
export function useChats() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: fetchChats,
    staleTime: 0,
    gcTime: 1000 * 60 * 5, // 5분
    refetchInterval: 3000, // 3초마다 메시지 재확인
  });
}

/**
 * Fetch chat messages with infinite scroll (cursor-based pagination)
 * Only fetches on initial render and when scrolling up (fetchNextPage).
 * @param {number | null} chatroomId - Chatroom ID
 * @returns {import('@tanstack/react-query').UseInfiniteQueryResult}
 */
export function useChatMessages(chatroomId) {
  return useInfiniteQuery({
    queryKey: ['chatMessages', chatroomId],
    queryFn: ({ pageParam = null }) => fetchChatMessages(chatroomId, pageParam),
    getNextPageParam: (lastPage) => lastPage.next || undefined,
    getPreviousPageParam: (firstPage) => firstPage.before || undefined,
    enabled: !!chatroomId,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
