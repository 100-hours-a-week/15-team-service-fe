import { useCallback, useMemo, useState } from "react";

/**
 * Temporary stub for useChatbot.
 * Expected API (used by ResumeViewerPage):
 * - useChatbot({ onUpdate })
 * - returns { messages, isLoading, handleSendMessage }
 */
export function useChatbot(options = {}) {
  const { onUpdate } = options;

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback(
    async (text) => {
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now()), role: "user", content: text },
      ]);

      // "loading" 흉내만 내고, onUpdate가 있으면 샘플 텍스트를 한 번 흘려보냄
      setIsLoading(true);
      try {
        const chunk = "\n# AI updated content (stub)\n";
        if (typeof onUpdate === "function") onUpdate(chunk);

        setMessages((prev) => [
          ...prev,
          { id: String(Date.now() + 1), role: "ai", content: "stub response" },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [onUpdate]
  );

  return useMemo(
    () => ({ messages, isLoading, handleSendMessage }),
    [messages, isLoading, handleSendMessage]
  );
}

export default useChatbot;
