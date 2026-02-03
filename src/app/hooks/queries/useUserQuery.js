import { useQuery } from '@tanstack/react-query';
import { fetchUser, fetchUserSettings } from '@/app/api/endpoints/user';

/**
 * Fetch user profile
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5, // 5분
    retry: 1, // 1회 재시도
  });
}

export function useAuthStatus() {
  return useQuery({
    queryKey: ['user', 'auth-status'],
    queryFn: fetchUser,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch user settings
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export function useUserSettings() {
  return useQuery({
    queryKey: ['user', 'settings'],
    queryFn: fetchUserSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}
