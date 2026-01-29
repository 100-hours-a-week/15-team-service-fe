import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchChats, fetchChatMessages } from '@/app/api/endpoints/chats';

/**
 * Fetch all chatrooms
 * @param {boolean} [enabled=true] - false이면 polling과 fetch를 중단
 * @returns {import('@tanstack/react-query').UseQueryResult<Array>}
 */
export function useChats(enabled = true) {
  return useQuery({
    queryKey: ['chats'],
    queryFn: fetchChats,
    staleTime: 0,
    gcTime: 1000 * 60 * 5, // 5분
    enabled,
    refetchInterval: enabled ? 3000 : false, // 리스트 뷰일 때만 polling
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
