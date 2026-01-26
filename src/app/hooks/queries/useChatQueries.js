import { useQuery } from '@tanstack/react-query';
import { fetchChats } from '@/app/api/endpoints/chats';

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
