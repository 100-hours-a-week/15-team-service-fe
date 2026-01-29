// v1: company selection disabled
/*
import { useQuery } from '@tanstack/react-query';
import { fetchCompanies } from '@/app/api/endpoints/companies';

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    staleTime: 1000 * 60 * 60, // 1시간
    gcTime: 1000 * 60 * 60 * 24, // 24시간
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
*/

export function useCompanies() {
  return {
    data: [],
    isLoading: false,
    isError: false,
  };
}
