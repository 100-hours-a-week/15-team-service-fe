import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchNotifications } from '@/app/api/endpoints/notifications';

/**
 * 알림 목록 infinite query (커서 기반)
 * @param {boolean} enabled - 시트가 열려있을 때만 true
 */
export function useNotifications(enabled = false) {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => fetchNotifications(pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.nextCursor : undefined,
    initialPageParam: undefined,
    enabled,
    staleTime: 0, // 열 때마다 최신 데이터
  });
}
