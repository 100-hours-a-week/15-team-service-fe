import { useMutation, useQueryClient } from '@tanstack/react-query';
import { masterProfileKeys } from '../queries/useMasterProfileQuery';
import { toast } from '@/app/lib/toast';

/**
 * Hook to update the master resume profile.
 * Currently simulates API call for UI implementation.
 */
export function useUpdateMasterProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Updating master profile with:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(masterProfileKeys.all, data);
      toast.success('프로필 정보가 저장되었습니다.');
    },
    onError: () => {
      toast.error('정보 저장 중 오류가 발생했습니다.');
    },
  });
}
