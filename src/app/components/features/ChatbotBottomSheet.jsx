import React, { useRef, useEffect } from "react";
import { X, Send, Pause, Play } from "lucide-react";

/**
 * @typedef {import('@/app/types').ChatMessage} ChatMessage
 */

/**
 * AI chatbot bottom sheet component for resume editing suggestions
 *
 * Implementation Decision - Manual Portal:
 * - Uses manual portal implementation (not Radix Sheet) due to complex state management
 * - Fixed positioning with max-w-[390px] ensures proper containment within app container
 * - Height: 70vh with fixed bottom position for mobile-optimized layout
 * - Renders to document.body via conditional rendering (if !isOpen return null)
 *
 * Implementation Decision - Why Not Radix Sheet:
 * - Custom message list with auto-scroll requires direct ref management
 * - Pause/resume functionality for streaming AI responses
 * - Complex input area with IME support and dynamic textarea resizing
 * - Manual implementation provides more control for these features
 *
 * Implementation Decision - Positioning:
 * - Uses fixed positioning (already correct, no scroll position bugs)
 * - Max-width: max-w-[390px] to match mobile app constraint
 * - Z-index: z-20 for overlay, z-30 for content (lower than modals which use z-50)
 *
 * @typedef {Object} ChatbotBottomSheetProps
 * @property {boolean} isOpen
 * @property {() => void} onClose
 * @property {ChatMessage[]} messages
 * @property {string} chatInput
 * @property {(value: string) => void} onInputChange
 * @property {() => void} onSendMessage
 * @property {boolean} isUpdating
 * @property {boolean} isPaused
 * @property {() => void} onTogglePause
 */

/**
 * @param {ChatbotBottomSheetProps} props
 */
export const ChatbotBottomSheet = ({
  isOpen,
  onClose,
  messages,
  chatInput,
  onInputChange,
  onSendMessage,
  isUpdating,
  isPaused,
  onTogglePause,
}) => {
  /** @type {React.RefObject<HTMLDivElement>} */
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-20" onClick={onClose} />
      <div
        className="fixed bottom-5 left-0 right-0 bg-white rounded-t-3xl z-30 max-w-[390px] mx-auto"
        style={{ height: "70vh" }}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex-1">
            <h3>CommitMe Assistant</h3>
            {isUpdating && !isPaused && <p className="text-xs text-primary mt-1">응답 중...</p>}
          </div>

          <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ height: "calc(70vh - 180px)" }}>
          {messages.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-8">수정하고 싶은 내용을 입력해주세요</div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={`${msg.timestamp}-${msg.role}-${idx}`}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[75%] ${msg.role === "user" ? "order-2" : "order-1"}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    msg.role === "user" ? "bg-primary text-white" : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
                <p className={`text-xs text-gray-500 mt-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Caption */}
        <div className="px-5 py-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">나가도 백그라운드에서 진행됩니다</p>
        </div>

        {/* Input Area */}
        <div className="p-5 border-t border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              placeholder="수정하고 싶은 내용을 입력하세요..."
              value={chatInput}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                // 한국어 등 IME 조합 중일 때는 Enter 키 무시
                if (e.nativeEvent.isComposing) return;

                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              disabled={isUpdating && !isPaused}
              className="flex-1 min-h-[44px] max-h-[120px] p-3 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={1}
            />
            <button
              onClick={isUpdating ? onTogglePause : onSendMessage}
              disabled={!chatInput.trim() && !isUpdating}
              className={`p-3 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 ${
                chatInput.trim() || isUpdating ? "bg-primary text-white" : "bg-gray-200 text-gray-400"
              }`}
              aria-label={isUpdating ? (isPaused ? "메시지 재개" : "메시지 일시정지") : "메시지 전송"}
            >
              {isUpdating ? (
                isPaused ? (
                  <Play className="w-5 h-5" strokeWidth={1.5} />
                ) : (
                  <Pause className="w-5 h-5" strokeWidth={1.5} />
                )
              ) : (
                <Send className="w-5 h-5" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
