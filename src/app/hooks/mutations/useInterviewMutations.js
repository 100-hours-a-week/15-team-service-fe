/**
 * Interview Mutation Hooks
 * React Query hooks for interview session operations with optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/app/lib/toast';
import {
  startInterview,
  submitInterviewAnswer,
  completeInterview,
  deleteInterview,
} from '@/app/api/endpoints/interviews';
import { interviewKeys } from '../queries/useInterviewQueries';

/**
 * Start interview mutation
 * @returns {UseMutationResult} Mutation result
 */
export function useStartInterview() {
  return useMutation({
    mutationFn: startInterview,
    onSuccess: () => {
      toast.success('면접이 시작되었습니다.');
    },
    onError: () => {
      toast.error('면접 시작에 실패했습니다.');
    },
  });
}

/**
 * Submit interview answer mutation
 * @returns {UseMutationResult} Mutation result
 */
export function useSubmitInterviewAnswer() {
  return useMutation({
    mutationFn: ({ sessionId, answer, audioFile }) =>
      submitInterviewAnswer(sessionId, { answer, audioFile }),
    onError: () => {
      toast.error('답변 제출에 실패했습니다.');
    },
  });
}

/**
 * Complete interview mutation
 * @returns {UseMutationResult} Mutation result
 */
export function useCompleteInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeInterview,
    onSuccess: (completedInterview) => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.lists() });
      queryClient.setQueryData(
        interviewKeys.detail(completedInterview.id),
        completedInterview
      );
      toast.success('면접이 완료되었습니다.');
    },
    onError: () => {
      toast.error('면접 완료 처리에 실패했습니다.');
    },
  });
}

/**
 * Delete interview mutation with optimistic update
 * @returns {UseMutationResult} Mutation result
 */
export function useDeleteInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInterview,
    // Optimistic update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: interviewKeys.lists() });
      const previousList = queryClient.getQueryData(interviewKeys.lists());

      if (previousList) {
        queryClient.setQueryData(interviewKeys.lists(), (old) => ({
          ...old,
          interviews:
            old.interviews?.filter((interview) => interview.id !== id) || [],
          total: (old.total || 0) - 1,
        }));
      }

      return { previousList };
    },
    onSuccess: () => {
      toast.success('면접 기록이 삭제되었습니다.');
    },
    onError: (error, id, context) => {
      // Rollback
      if (context?.previousList) {
        queryClient.setQueryData(interviewKeys.lists(), context.previousList);
      }
      toast.error('면접 기록 삭제에 실패했습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: interviewKeys.lists() });
    },
  });
}
