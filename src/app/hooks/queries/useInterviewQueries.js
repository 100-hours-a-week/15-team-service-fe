/**
 * Interview Query Hooks
 * React Query hooks for fetching interview data
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchInterviews,
  fetchInterviewById,
} from '@/app/api/endpoints/interviews';

/**
 * Query keys for interview data
 * Follows hierarchical pattern: [domain, scope, ...params]
 */
export const interviewKeys = {
  all: ['interviews'],
  lists: () => [...interviewKeys.all, 'list'],
  list: (filters) => [...interviewKeys.lists(), filters],
  details: () => [...interviewKeys.all, 'detail'],
  detail: (id) => [...interviewKeys.details(), id],
};

/**
 * Fetch interviews with optional filters
 * @param {Object} filters - Query filters (status, page, limit)
 * @returns {UseQueryResult} Query result with interview list
 */
export function useInterviews(filters = {}) {
  return useQuery({
    queryKey: interviewKeys.list(filters),
    queryFn: () => fetchInterviews(filters),
    staleTime: 1000 * 60, // 1분
    keepPreviousData: true, // 페이지네이션 중 이전 데이터 유지
  });
}

/**
 * Fetch interview by ID
 * @param {string} id - Interview ID
 * @param {Object} options - Additional query options
 * @returns {UseQueryResult} Query result with interview detail
 */
export function useInterview(id, options = {}) {
  return useQuery({
    queryKey: interviewKeys.detail(id),
    queryFn: () => fetchInterviewById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5분
    ...options,
  });
}
