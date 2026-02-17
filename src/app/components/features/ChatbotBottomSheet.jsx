import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useLayoutEffect,
} from 'react';
import { X, Send, ChevronDown } from 'lucide-react';
import { Drawer } from 'vaul';
import { toast } from '@/app/lib/toast';
import {
  formatMessageDate,
  formatMessageTime,
  getLocalDate,
} from '@/app/lib/utils';

/**
 * @typedef {import('@/app/types').ChatMessage} ChatMessage
 */

/**
 * @typedef {Object} ChatbotBottomSheetProps
 * @property {boolean} isOpen
 * @property {() => void} onClose
 * @property {ChatMessage[]} messages
 * @property {string} chatInput
 * @property {(value: string) => void} onInputChange
 * @property {() => void} onSendMessage
 * @property {boolean} isUpdating
 * @property {boolean} isConnected - SSE connection status
 */

/**
 * ChatbotBottomSheet with ResizeObserver-based scroll management,
 * long message handling, date dividers, and character limits.
 *
 * @param {ChatbotBottomSheetProps} props
 */
export const ChatbotBottomSheet = ({
  isOpen,
  onClose,
  messages,
  chatInput = '',
  onInputChange,
  onSendMessage,
  isUpdating,
  isConnected,
}) => {
  const scrollContainerRef = useRef(null);
  const contentRef = useRef(null); // ResizeObserver wrapper
  const isNearBottomRef = useRef(true);
  const didInitialScrollRef = useRef(false);

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [expandedMessageIds, setExpandedMessageIds] = useState(() => new Set());

  const MAX_MESSAGE_LENGTH = 500; // 500자 초과 시 더보기
  const MAX_INPUT_LENGTH = 10000; // 입력 최대 글자수

  const scrollToBottom = useCallback(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop =
      scrollContainerRef.current.scrollHeight;
  }, []);

  // Sync isNearBottom state with ref (stale closure prevention)
  useEffect(() => {
    isNearBottomRef.current = isNearBottom;
  }, [isNearBottom]);

  // Reset scroll state when opening
  useEffect(() => {
    if (isOpen) {
      didInitialScrollRef.current = false;
      setIsNearBottom(true);
    } else {
      // Cleanup on close
      setExpandedMessageIds(new Set());
    }
  }, [isOpen]);

  /**
   * ResizeObserver-based bottom-stick: Auto-scroll when content height changes
   * (e.g., AI response streaming) if user is near bottom
   */
  useEffect(() => {
    if (!isOpen || !scrollContainerRef.current || !contentRef.current) return;

    const observer = new ResizeObserver(() => {
      if (!scrollContainerRef.current) return;

      // Initial scroll
      if (!didInitialScrollRef.current && messages.length > 0) {
        scrollToBottom();
        didInitialScrollRef.current = true;
        setIsNearBottom(true);
        return;
      }

      // Auto-scroll only if user is near bottom (respects reading state)
      if (isNearBottomRef.current) {
        scrollToBottom();
      }
    });

    observer.observe(contentRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isOpen, scrollToBottom, messages.length]);

  /**
   * Initial scroll on open (force once before ResizeObserver settles)
   */
  useLayoutEffect(() => {
    if (!isOpen || didInitialScrollRef.current || messages.length === 0) return;

    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        scrollToBottom();
        didInitialScrollRef.current = true;
        setIsNearBottom(true);
      });
    });

    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [isOpen, messages.length, scrollToBottom]);

  /**
   * Detect scroll position for scroll-to-bottom button
   */
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;

    const isBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsNearBottom(isBottom);
  }, []);

  /**
   * Toggle expanded state for long messages
   */
  const toggleExpanded = useCallback((messageId) => {
    setExpandedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }, []);

  /**
   * Determine if date divider should be shown before this message
   */
  const shouldShowDateDivider = (msg, index, messages) => {
    if (index === 0) return true;

    const currentDate = getLocalDate(msg.timestamp);
    const prevDate = getLocalDate(messages[index - 1].timestamp);
    return currentDate !== prevDate;
  };

  /**
   * Handle send message with validation
   */
  const handleSend = useCallback(() => {
    if (!chatInput.trim() || isUpdating) return;

    if (chatInput.length > MAX_INPUT_LENGTH) {
      toast.error(
        `메시지는 최대 ${MAX_INPUT_LENGTH.toLocaleString()}자까지 입력 가능합니다.`
      );
      return;
    }

    onSendMessage();
  }, [chatInput, isUpdating, onSendMessage]);

  const handleKeyDown = (e) => {
    // 한국어 등 IME 조합 중일 때는 Enter 키 무시
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      dismissible={true}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-y-0 left-1/2 z-20 w-full max-w-[390px] -translate-x-1/2 bg-black/50" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-30 flex flex-col max-w-[390px] mx-auto w-full"
          style={{
            height: '70vh',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex-1">
              <Drawer.Title className="text-base font-semibold">
                CommitMe Assistant
              </Drawer.Title>
              {!isConnected && (
                <p className="text-xs text-gray-500 mt-1">연결 중...</p>
              )}
              {isConnected && isUpdating && (
                <p className="text-xs text-primary mt-1">
                  수정 요청 처리 중...
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 relative">
            <div
              ref={scrollContainerRef}
              className="absolute inset-0 overflow-y-auto px-5 py-4"
              onScroll={handleScroll}
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500 text-sm">
                    수정하고 싶은 내용을 입력해주세요.
                  </div>
                </div>
              ) : (
                <div ref={contentRef} className="space-y-3">
                  {messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    const timeString = formatMessageTime(msg.timestamp);
                    const showDateDivider = shouldShowDateDivider(
                      msg,
                      idx,
                      messages
                    );
                    const messageId = `${msg.timestamp}-${msg.role}-${idx}`;
                    const isExpanded = expandedMessageIds.has(messageId);
                    const messageText = msg.content || '';
                    const isLongMessage =
                      messageText.length > MAX_MESSAGE_LENGTH;
                    const displayMessage = isLongMessage
                      ? isExpanded
                        ? messageText
                        : `${messageText.slice(0, MAX_MESSAGE_LENGTH)}...`
                      : messageText;

                    return (
                      <div key={messageId}>
                        {/* Date Divider */}
                        {showDateDivider && (
                          <div className="flex justify-center my-4">
                            <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                              {formatMessageDate(msg.timestamp)}
                            </div>
                          </div>
                        )}

                        {/* Message Container */}
                        <div
                          className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          {/* Timestamp (left side for user) */}
                          {isUser && timeString && (
                            <span className="text-xs text-gray-500 mb-1">
                              {timeString}
                            </span>
                          )}

                          {/* Message Bubble */}
                          <div className="max-w-[75%] min-w-0">
                            <div
                              className={`rounded-2xl px-4 py-3 ${
                                isUser
                                  ? 'bg-primary text-white rounded-br-sm'
                                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                              }`}
                            >
                              <p
                                className="text-sm break-words whitespace-pre-wrap"
                                style={{
                                  overflowWrap: 'anywhere',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {displayMessage}
                              </p>
                              {isLongMessage && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(messageId)}
                                  className={`mt-2 text-xs underline ${
                                    isUser
                                      ? 'text-white/80 hover:text-white'
                                      : 'text-gray-500 hover:text-gray-700'
                                  }`}
                                >
                                  {isExpanded ? '접기' : '더보기'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Timestamp (right side for AI) */}
                          {!isUser && timeString && (
                            <span className="text-xs text-gray-500 mb-1">
                              {timeString}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Scroll to Bottom Button */}
            {!isNearBottom && messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop =
                      scrollContainerRef.current.scrollHeight;
                  }
                }}
                className="absolute bottom-4 right-8 bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors z-10"
                aria-label="맨 아래로 스크롤"
              >
                <ChevronDown className="w-5 h-5 text-gray-700" />
              </button>
            )}
          </div>

          {/* Caption */}
          <div className="px-5 py-2 border-t border-gray-100 flex-shrink-0">
            <p className="text-xs text-gray-500 text-center">
              해당 채팅창을 꺼도 백그라운드에서 수정이 진행됩니다.
            </p>
          </div>

          {/* Input Area */}
          <div className="p-5 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                placeholder="수정하고 싶은 내용을 입력해주세요."
                value={chatInput}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  if (nextValue.length > MAX_INPUT_LENGTH) {
                    toast.error(
                      `메시지는 최대 ${MAX_INPUT_LENGTH.toLocaleString()}자까지 입력 가능합니다.`
                    );
                    return;
                  }
                  onInputChange(nextValue);
                }}
                onKeyDown={handleKeyDown}
                disabled={isUpdating || !isConnected}
                className="flex-1 min-h-[44px] max-h-[120px] p-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                rows={1}
                maxLength={MAX_INPUT_LENGTH}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!chatInput.trim() || isUpdating || !isConnected}
                className={`p-3 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 transition-colors ${
                  chatInput.trim() && !isUpdating && isConnected
                    ? 'bg-primary text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                aria-label="메시지 전송"
              >
                <Send className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
