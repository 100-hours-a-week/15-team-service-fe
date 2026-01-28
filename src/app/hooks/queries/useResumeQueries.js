import { useQuery } from '@tanstack/react-query';
import {
  fetchResumes,
  fetchResumeById,
  fetchResumeVersion,
} from '@/app/api/endpoints/resumes';

export function useResumes({ page = 0, size = 10 } = {}) {
  return useQuery({
    queryKey: ['resumes', { page, size }],
    queryFn: () => fetchResumes({ page, size }),
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
