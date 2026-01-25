import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateUser, updateUserSettings } from '@/app/api/endpoints/user';

/**
 * Update user profile mutation
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user', 'profile'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });

      toast.success('프로필이 저장되었습니다.');
    },
    onError: (error) => {
      const errorCode = error.response?.data?.code;
      const status = error.response?.status;

      if (status === 401) {
        toast.error('로그인이 필요합니다.');
        window.location.href = '/';
        return;
      }

      switch (errorCode) {
        case 'NAME_INVALID_INPUT':
          toast.error('이름은 공백과 이모티콘을 제외한 2~10자로 입력해주세요.');
          break;
        case 'POSITION_SELECTION_REQUIRED':
          toast.error('희망 포지션을 선택해주세요.');
          break;
        case 'USER_PRIVACY_REQUIRED':
          toast.error('개인정보 처리방침에 동의해주세요.');
          break;
        case 'USER_PHONE_PRIVACY_REQUIRED':
          toast.error('전화번호 수집·이용에 동의해주세요.');
          break;
        case 'POSITION_NOT_FOUND':
          toast.error('선택한 포지션을 찾을 수 없습니다.');
          break;
        default:
          toast.error('프로필 업데이트에 실패했습니다.');
      }
    },
  });
}

/**
 * Update user settings mutation
 * Invalidates settings query after success
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'settings'] });
    },
    onError: (error) => {
      const status = error.response?.status;

      if (status === 401) {
        toast.error('로그인이 필요합니다.');
        window.location.href = '/';
        return;
      }

      toast.error('설정 업데이트에 실패했습니다.');
    },
  });
}
