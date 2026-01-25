import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export const useChatbot = (options = {}) => {
  const { onUpdate } = options;
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timersRef = useRef({ update: null, finish: null });

  const clearTimers = useCallback(() => {
    if (timersRef.current.update) {
      clearTimeout(timersRef.current.update);
      timersRef.current.update = null;
    }
    if (timersRef.current.finish) {
      clearTimeout(timersRef.current.finish);
      timersRef.current.finish = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const getTimestamp = () =>
    new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });

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

  const scheduleResponse = useCallback(() => {
    clearTimers();

    timersRef.current.update = setTimeout(() => {
      if (typeof onUpdate === 'function') {
        onUpdate('\n# AI가 수정한 내용...');
      }
    }, 1000);

    timersRef.current.finish = setTimeout(() => {
      appendMessage('ai', '업데이트 내용을 반영했어요.');
      setIsUpdating(false);
      setIsPaused(false);
      toast.success('업데이트가 반영되었습니다');
    }, 1500);
  }, [appendMessage, clearTimers, onUpdate]);

  const handleInputChange = useCallback((value) => {
    setChatInput(value);
  }, []);

  const handleSendMessage = useCallback(() => {
    const trimmed = chatInput.trim();
    if (!trimmed || isUpdating) return;

    appendMessage('user', trimmed);
    setChatInput('');
    setIsUpdating(true);
    setIsPaused(false);
    scheduleResponse();
  }, [appendMessage, chatInput, isUpdating, scheduleResponse]);

  const handleTogglePause = useCallback(() => {
    if (!isUpdating) return;

    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        clearTimers();
      } else {
        scheduleResponse();
      }
      return next;
    });
  }, [clearTimers, isUpdating, scheduleResponse]);

  return {
    messages,
    chatInput,
    isUpdating,
    isPaused,
    onInputChange: handleInputChange,
    onSendMessage: handleSendMessage,
    onTogglePause: handleTogglePause,
  };
};
