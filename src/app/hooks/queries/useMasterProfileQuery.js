import { useQuery } from '@tanstack/react-query';
import { fetchMasterProfile } from '@/app/api/endpoints/resumes';

export const masterProfileKeys = {
  all: ['masterProfile'],
};

/**
 * Hook to fetch the master resume profile.
 * Calls GET /resumes/profile to get the base profile template.
 */
export function useMasterProfile({ enabled = true } = {}) {
  return useQuery({
    queryKey: masterProfileKeys.all,
    queryFn: fetchMasterProfile,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
}
