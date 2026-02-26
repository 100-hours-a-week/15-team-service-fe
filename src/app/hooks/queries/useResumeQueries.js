/**
 * Resume Query Hooks
 * React Query hooks for fetching resume data
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  fetchResumes,
  fetchResumeById,
  fetchResumeVersion,
} from '@/app/api/endpoints/resumes';

/**
 * Query keys for resume data
 */
export const resumeKeys = {
  all: ['resumes'],
  lists: () => [...resumeKeys.all, 'list'],
  list: (filters) => [...resumeKeys.lists(), filters],
  details: () => [...resumeKeys.all, 'detail'],
  detail: (id) => [...resumeKeys.details(), id],
};

/**
 * Fetch resumes with infinite scroll (cursor-based pagination)
 * Supports search and sort functionality
 * @param {Object} params
 * @param {number} params.size - Page size (default: 10)
 * @param {string} params.keyword - Search keyword (optional, 1-30 chars)
 * @param {string} params.sortedBy - Sort order: UPDATED_DESC (default) | UPDATED_ASC
 * @returns {import('@tanstack/react-query').UseInfiniteQueryResult}
 */
export function useResumes({
  size = 10,
  keyword = '',
  sortedBy = 'UPDATED_DESC',
} = {}) {
  return useInfiniteQuery({
    queryKey: ['resumes', 'list', { size, keyword: keyword.trim(), sortedBy }],
    queryFn: ({ pageParam = null }) =>
      fetchResumes({
        next: pageParam,
        size,
        keyword: keyword.trim() || undefined,
        sortedBy,
      }),
    getNextPageParam: (lastPage) => lastPage.next || undefined,
    initialPageParam: null,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });
}

export function useResumeDetail(resumeId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => fetchResumeById(resumeId),
    enabled: enabled && !!resumeId,
  });
}

export function useResumeVersion(
  resumeId,
  versionNo,
  { enabled = true, refetchInterval } = {}
) {
  return useQuery({
    queryKey: ['resume', resumeId, 'version', versionNo],
    queryFn: () => fetchResumeVersion(resumeId, versionNo),
    enabled: enabled && !!resumeId && !!versionNo,
    refetchInterval,
  });
}
