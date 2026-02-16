import { useCallback, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { editResume } from '@/app/api/endpoints/resumes';
import { useResumeSSE } from './useResumeSSE';

/**
 * Chatbot hook for resume editing with real SSE and API integration
 * @param {Object} options
 * @param {number} options.resumeId - Resume ID to edit
 * @param {Function} options.onUpdate - Callback when resume data is updated
 * @returns {Object} Chatbot state and handlers
 */
export const useChatbot = (options = {}) => {
  const { resumeId, onUpdate } = options;
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  // Track active task ID to match PATCH response with SSE event
  const activeTaskIdRef = useRef(null);

  /**
   * Get ISO timestamp for message
   */
  const getTimestamp = () => new Date().toISOString();

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

  // SSE subscription for resume edit events
  const { isConnected } = useResumeSSE(resumeId, {
    onEditComplete: (eventData) => {
      // Only handle if it matches our active task
      if (eventData.taskId === activeTaskIdRef.current) {
        // Add AI completion message
        appendMessage('assistant', '업데이트 내용을 반영했어요.');

        // Trigger onUpdate callback with new resume data
        if (typeof onUpdate === 'function') {
          onUpdate(eventData.resume);
        }

        // Show success toast
        toast.success('이력서가 업데이트되었습니다');

        // Invalidate React Query cache
        queryClient.invalidateQueries({
          queryKey: ['resume', resumeId],
        });
        queryClient.invalidateQueries({
          queryKey: ['resume', resumeId, 'version', eventData.versionNo],
        });

        // Reset state
        setIsUpdating(false);
        activeTaskIdRef.current = null;
      } else {
        console.warn('[useChatbot] Task ID mismatch - ignoring event');
      }
    },
  });

  // Edit resume mutation (PATCH /resumes/{id})
  const editMutation = useMutation({
    mutationFn: (message) => editResume(resumeId, message),
    onSuccess: (data) => {
      // Store task ID to match with SSE event
      activeTaskIdRef.current = data.taskId;
      setIsUpdating(true);
    },
    onError: (error) => {
      console.error('[useChatbot] PATCH request error:', error);
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;

      if (errorCode === 'RESUME_EDIT_IN_PROGRESS') {
        toast.error(
          '이미 수정 중인 작업이 있습니다. 완료 후 다시 시도해주세요.'
        );
      } else {
        toast.error(errorMessage || '수정 요청에 실패했습니다.');
      }

      setIsUpdating(false);
      activeTaskIdRef.current = null;
    },
  });

  const handleInputChange = useCallback((value) => {
    setChatInput(value);
  }, []);

  const handleSendMessage = useCallback(() => {
    const trimmed = chatInput.trim();

    // Validation: must have message, not updating, and SSE connected
    if (!trimmed || isUpdating || !isConnected) return;

    // Add user message to UI
    appendMessage('user', trimmed);
    setChatInput('');

    // Send edit request
    editMutation.mutate(trimmed);
  }, [chatInput, isUpdating, isConnected, editMutation, appendMessage]);

  return {
    messages,
    chatInput,
    isUpdating,
    isConnected,
    onInputChange: handleInputChange,
    onSendMessage: handleSendMessage,
  };
};
