import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { editResume } from '@/app/api/endpoints/resumes';
import { useNotificationContext } from './useNotificationSSE';

const getTimestamp = () => new Date().toISOString();

/**
 * Chatbot hook for resume editing with real SSE and API integration.
 *
 * Resume refresh events come from the unified /notifications/stream SSE connection
 * via the sse:resume-refresh-required custom window event dispatched by useNotificationSSE.
 *
 * @param {Object} options
 * @param {number} options.resumeId - Resume ID to edit
 * @param {boolean} [options.isEditing=false] - Server-side editing flag (blocks chat when true)
 * @returns {Object} Chatbot state and handlers
 */
export const useChatbot = (options = {}) => {
  const { resumeId, isEditing = false } = options;
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  // isConnected comes from the single global SSE stream
  const { isConnected } = useNotificationContext();

  // Mirror isUpdating in a ref to prevent stale closures in the window event handler
  const isUpdatingRef = useRef(false);

  const appendMessage = useCallback((role, content) => {
    setMessages((prev) => [
      ...prev,
      {
        role,
        content,
        timestamp: getTimestamp(),
      },
    ]);
  }, []);

  // Listen for resume-refresh-required events from the unified SSE stream
  useEffect(() => {
    const handler = (e) => {
      const { resumeId: eventResumeId, status } = e.detail;
      if (eventResumeId !== resumeId) return;

      // Always invalidate to keep viewer and list in sync
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: ['resume', resumeId] });

      // Only update chatbot UI if a chatbot edit is in flight
      if (isUpdatingRef.current) {
        if (status === 'SUCCEEDED') {
          appendMessage('assistant', '업데이트 내용을 반영했어요.');
          toast.success('이력서가 업데이트되었습니다');
        } else {
          appendMessage(
            'assistant',
            '죄송합니다. 수정 작업 중 문제가 발생했습니다. 재시도해주세요.'
          );
          toast.error('이력서 수정 실패');
        }
        setIsUpdating(false);
        isUpdatingRef.current = false;
      }
    };

    window.addEventListener('sse:resume-refresh-required', handler);
    return () =>
      window.removeEventListener('sse:resume-refresh-required', handler);
  }, [resumeId, queryClient, appendMessage]);

  // Edit resume mutation (PATCH /resumes/{id})
  const editMutation = useMutation({
    mutationFn: (message) => editResume(resumeId, message),
    onSuccess: () => {
      setIsUpdating(true);
      isUpdatingRef.current = true;

      // Add AI acknowledgment message immediately
      appendMessage('assistant', '확인했습니다. 수정 시작하겠습니다.');
    },
    onError: (error) => {
      console.error('[useChatbot] PATCH request error:', error);
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;

      if (errorCode === 'RESUME_EDIT_IN_PROGRESS') {
        appendMessage(
          'assistant',
          '죄송합니다. 이미 수정 중인 작업이 있습니다. 완료 후 다시 시도해주세요.'
        );
      } else {
        appendMessage(
          'assistant',
          `죄송합니다. 요청 처리 중 문제가 발생했습니다.\n${errorMessage || '알 수 없는 오류가 발생했습니다.'}`
        );
      }

      setIsUpdating(false);
      isUpdatingRef.current = false;
    },
  });

  const handleInputChange = useCallback((value) => {
    setChatInput(value);
  }, []);

  const handleSendMessage = useCallback(() => {
    const trimmed = chatInput.trim();

    // Validation: must have message, not updating (local or server-side), and SSE connected
    if (!trimmed || isUpdating || isEditing || !isConnected) return;

    // Add user message to UI
    appendMessage('user', trimmed);
    setChatInput('');

    // Send edit request
    editMutation.mutate(trimmed);
  }, [
    chatInput,
    isUpdating,
    isEditing,
    isConnected,
    editMutation,
    appendMessage,
  ]);

  return {
    messages,
    chatInput,
    isUpdating,
    isConnected,
    onInputChange: handleInputChange,
    onSendMessage: handleSendMessage,
  };
};
