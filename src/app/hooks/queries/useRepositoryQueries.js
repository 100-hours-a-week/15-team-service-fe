import { useQuery } from '@tanstack/react-query';
import { fetchRepositories } from '@/app/api/endpoints/repositories';

/**
 * Fetch user's GitHub repositories
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useRepositories() {
  return useQuery({
    queryKey: ['repositories'],
    queryFn: fetchRepositories,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
