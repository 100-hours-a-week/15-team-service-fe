/**
 * Repository Query Hooks
 * React Query hooks for fetching GitHub repository data
 */

import { useQuery } from '@tanstack/react-query';
import { fetchRepositories } from '@/app/api/endpoints/repositories';

/**
 * Query keys for repository data
 */
export const repositoryKeys = {
  all: ['repositories'],
  lists: () => [...repositoryKeys.all, 'list'],
  list: (filters) => [...repositoryKeys.lists(), filters],
};

/**
 * Fetch user's GitHub repositories
 * @param {Object} filters - Query filters (search, sort, order)
 * @returns {UseQueryResult} Query result with repository list
 */
export function useRepositories(filters = {}) {
  return useQuery({
    queryKey: repositoryKeys.list(filters),
    queryFn: () => fetchRepositories(filters),
    staleTime: 1000 * 60 * 5, // 5분
  });
}
