import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/app/lib/toast';
import {
  getGithubLoginUrl,
  logout,
  completeOnboarding,
} from '@/app/api/endpoints/auth';

/**
 * @returns {UseMutationResult}
 */
export function useGetGithubLoginUrl() {
  return useMutation({
    mutationFn: getGithubLoginUrl,
    onSuccess: ({ loginUrl }) => {
      window.location.href = loginUrl;
    },
    onError: () => {
      toast.error('GitHub 로그인 URL을 가져오지 못했습니다.');
    },
  });
}

/**
 * @returns {UseMutationResult}
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success('회원가입이 완료되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      const errorCode = error.response?.data?.code;
      const status = error.response?.status;

      if (status === 401) {
        toast.error('로그인이 필요합니다.');
        window.location.href = '/login';
        return;
      }

      if (status === 409 && errorCode === 'USER_ALREADY_ONBOARDED') {
        toast.info('이미 가입된 사용자입니다.');
        window.location.href = '/';
        return;
      }

      if (status === 403 && errorCode === 'OAUTH_ACCOUNT_WITHDRAWN') {
        toast.error('탈퇴한 계정입니다. 30일 후 재가입 가능합니다.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
        return;
      }

      if (status !== 400) {
        toast.error('회원가입에 실패했습니다.');
      }
    },
  });
}

/**
 * @returns {UseMutationResult}
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      toast.success('로그아웃되었습니다.');
      window.location.href = '/login';
    },
    onError: () => {
      queryClient.clear();
      window.location.href = '/login';
    },
  });
}
