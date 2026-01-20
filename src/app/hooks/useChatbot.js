import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export const useChatbot = (options = {}) => {
  const { onUpdate } = options;
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim() || isUpdating) return;

    const userMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsUpdating(true);

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const aiMessage = {
        role: 'assistant',
        content: '네, 요청하신 내용을 반영하여 이력서를 수정하고 있습니다. 잠시만 기다려주세요.',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMessage]);

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
