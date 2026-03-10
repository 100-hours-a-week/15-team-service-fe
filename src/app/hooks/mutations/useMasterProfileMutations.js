import { useMutation, useQueryClient } from '@tanstack/react-query';
import { masterProfileKeys } from '../queries/useMasterProfileQuery';
import { updateMasterProfile } from '@/app/api/endpoints/resumes';
import { toast } from '@/app/lib/toast';

/**
 * Hook to update the master resume profile.
 * Calls PUT /resumes/profile
 */
export function useUpdateMasterProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMasterProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(masterProfileKeys.all, data);
      toast.success('프로필 정보가 저장되었습니다.');
    },
    onError: () => {
      toast.error('정보 저장 중 오류가 발생했습니다.');
    },
  });
}
