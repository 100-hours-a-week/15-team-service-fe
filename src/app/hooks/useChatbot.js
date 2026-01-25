import { useCallback, useMemo, useState } from 'react';

export const useChatbot = (options = {}) => {
  const { onUpdate } = options;
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim() || isUpdating) return;

  const handleSendMessage = useCallback(
    async (text) => {
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now()), role: 'user', content: text },
      ]);

      // "loading" 흉내만 내고, onUpdate가 있으면 샘플 텍스트를 한 번 흘려보냄
      setIsLoading(true);
      try {
        const chunk = '\n# AI updated content (stub)\n';
        if (typeof onUpdate === 'function') onUpdate(chunk);

        setMessages((prev) => [
          ...prev,
          { id: String(Date.now() + 1), role: 'ai', content: 'stub response' },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [onUpdate]
  );

      // YAML 업데이트 시뮬레이션
      setTimeout(() => {
        if (onUpdate) {
          onUpdate('\n# AI가 수정한 내용...');
        }
        setIsUpdating(false);
        toast.success('업데이트가 반영되었습니다');
      }, 1500);
    }, 1000);
  }, [chatInput, isUpdating, onUpdate]);

  return {
    messages,
    chatInput,
    setChatInput,
    isUpdating,
    isPaused,
    setIsPaused,
    handleSendMessage,
  };
};
