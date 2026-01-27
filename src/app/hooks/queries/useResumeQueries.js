import { useQuery } from '@tanstack/react-query';
import {
  fetchResumes,
  fetchResumeById,
  fetchResumeVersion,
} from '@/app/api/endpoints/resumes';

/**
 * Fetch paginated list of resumes
 * @param {Object} params
 * @param {number} [params.page=0]
 * @param {number} [params.size=10]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useResumes({ page = 0, size = 10 } = {}) {
  return useQuery({
    queryKey: ['resumes', { page, size }],
    queryFn: () => fetchResumes({ page, size }),
  });
}

/**
 * Fetch resume detail by ID
 * @param {number} resumeId
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true]
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useResumeDetail(resumeId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => fetchResumeById(resumeId),
    enabled: enabled && !!resumeId,
  });
}

/**
 * Fetch specific version of a resume
 * @param {number} resumeId
 * @param {number} versionNo
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true]
 * @param {number} [options.refetchInterval] - Polling interval in ms
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
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
