import { useQuery } from '@tanstack/react-query';
import { fetchPositions } from '@/app/api/endpoints/positions';

/**
 * @returns {import('@tanstack/react-query').UseQueryResult<Array<{id: number, name: string}>>}
 */
export function usePositions() {
  return useQuery({
    queryKey: ['positions'],
    queryFn: fetchPositions,
    staleTime: 1000 * 60 * 60, // 1시간
    gcTime: 1000 * 60 * 60 * 24, // 24시간
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
