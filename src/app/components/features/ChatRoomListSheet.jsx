import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import {
  MessageSquare,
  Loader2,
  ChevronLeft,
  X,
  Send,
  ChevronDown,
  Paperclip,
} from 'lucide-react';
import { Drawer } from 'vaul';
import { useChats, useChatMessages } from '@/app/hooks/queries/useChatQueries';
import { useUserProfile } from '@/app/hooks/queries/useUserQuery';
import { useChatWebSocket } from '@/app/hooks/useChatWebSocket';
import {
  formatKoreanTimestamp,
  formatMessageTime,
  formatMessageDate,
  getLocalDate,
} from '@/app/lib/utils';
import { useUploadFile } from '@/app/hooks/mutations/useUploadMutations';

export function ChatRoomListSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'messages'
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedRoomName, setSelectedRoomName] = useState('');

  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [failedMessages, setFailedMessages] = useState([]);
  const attachFileInputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const contentRef = useRef(null); // Wrapper for ResizeObserver
  const [isNearBottom, setIsNearBottom] = useState(true);
  const isNearBottomRef = useRef(true);
  const didInitialScrollRef = useRef(false);

  const { upload, isUploading } = useUploadFile('CHAT_ATTACHMENT');

  const {
    data: chatRooms = [],
    isLoading,
    isError,
    error,
  } = useChats(isOpen && viewMode === 'list');

  const { data: userProfile } = useUserProfile();
  const currentUserId = userProfile?.id;

  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    isError: isMessagesError,
    error: messagesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatMessages(viewMode === 'messages' ? selectedRoomId : null);

  const { sendMessage: stompSend, isConnected } = useChatWebSocket(
    viewMode === 'messages' ? selectedRoomId : null
  );
  const [isSending, setIsSending] = useState(false);

  const messages = useMemo(() => {
    const rawMessages =
      messagesData?.pages?.flatMap((page) => page.chats) || [];
    return rawMessages.slice().sort((a, b) => {
      const aTime = a?.sendAt ? new Date(a.sendAt).getTime() : 0;
      const bTime = b?.sendAt ? new Date(b.sendAt).getTime() : 0;
      if (aTime === bTime) {
        return (a?.id ?? 0) - (b?.id ?? 0);
      }
      return aTime - bTime;
    });
  }, [messagesData]);

  const scrollToBottom = useCallback(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop =
      scrollContainerRef.current.scrollHeight;
  }, []);

  const isSafePreviewUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    try {
      return new URL(url).protocol === 'blob:';
    } catch {
      return false;
    }
  };

  /**
   * Handle chat room card click
   * Switches to message view for the selected room
   * @param {number} roomId - Chat room ID
   * @param {string} roomName - Chat room name
   */
  const handleRoomClick = (roomId, roomName) => {
    setSelectedRoomId(roomId);
    setSelectedRoomName(roomName);
    setViewMode('messages');
  };

  // Sync isNearBottom state with ref for stable access in callbacks
  useEffect(() => {
    isNearBottomRef.current = isNearBottom;
  }, [isNearBottom]);

  useEffect(() => {
    if (viewMode === 'messages') {
      didInitialScrollRef.current = false;
      setIsNearBottom(true);
    }
  }, [viewMode, selectedRoomId]);

  /**
   * ResizeObserver-based bottom-stick: Auto-scroll to bottom when content height changes
   * (e.g., images loading, new messages) if user is near bottom
   * This replaces the polling-based loadingImages approach
   */
  useEffect(() => {
    if (
      viewMode !== 'messages' ||
      !scrollContainerRef.current ||
      !contentRef.current
    )
      return;

    const observer = new ResizeObserver(() => {
      if (!scrollContainerRef.current) return;

      if (!didInitialScrollRef.current && messages.length > 0) {
        scrollToBottom();
        didInitialScrollRef.current = true;
        setIsNearBottom(true);
        return;
      }

      // Only auto-scroll if user is near bottom (respects reading state)
      if (isNearBottomRef.current) {
        scrollToBottom();
      }
    });

    observer.observe(contentRef.current);

    return () => {
      observer.disconnect();
    };
  }, [viewMode, selectedRoomId, scrollToBottom, messages.length]); // Re-observe when switching rooms

  /**
   * Handle back button click
   * Returns to chat room list view
   */
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedRoomId(null);
    setSelectedRoomName('');
    setInputText('');
    didInitialScrollRef.current = false;
    if (attachedImage) {
      URL.revokeObjectURL(attachedImage.previewUrl);
      setAttachedImage(null);
    }
    failedMessages.forEach((msg) => {
      if (msg.previewUrl) URL.revokeObjectURL(msg.previewUrl);
    });
    setFailedMessages([]);
    setIsNearBottom(true);
  };

  // Initial scroll on room entry (force once even before ResizeObserver settles)
  useLayoutEffect(() => {
    if (
      viewMode !== 'messages' ||
      didInitialScrollRef.current ||
      messages.length === 0
    )
      return;

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
  }, [viewMode, selectedRoomId, messages.length, scrollToBottom]);

  // Detect scroll position for infinite scroll
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;

    // Check if near top (load more) - block until initial bottom scroll completes
    if (
      didInitialScrollRef.current &&
      scrollTop < 100 &&
      scrollHeight > clientHeight &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }

    // Check if near bottom (for auto-scroll logic)
    const isBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsNearBottom(isBottom);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleAttachImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (attachedImage) URL.revokeObjectURL(attachedImage.previewUrl);

    const previewUrl = URL.createObjectURL(file);
    setAttachedImage({ file, previewUrl });

    // Reset so same file can be re-selected
    e.target.value = '';
  };

  const removeAttachedImage = () => {
    if (attachedImage) {
      URL.revokeObjectURL(attachedImage.previewUrl);
      setAttachedImage(null);
    }
  };

  // Handle send message with optional image attachment (STOMP WebSocket)
  const handleSend = async () => {
    if ((!inputText.trim() && !attachedImage) || isSending || isUploading)
      return;

    const messageText = inputText;
    const imageData = attachedImage;

    setInputText('');
    setAttachedImage(null);
    setIsSending(true);

    let uploadId;
    try {
      if (imageData) {
        const result = await upload(imageData.file);
        uploadId = result.uploadId;
      }

      stompSend({
        message: messageText,
        ...(uploadId !== undefined && { attachmentUploadIds: [uploadId] }),
      });

      if (imageData?.previewUrl) {
        URL.revokeObjectURL(imageData.previewUrl);
      }

      // ResizeObserver will auto-scroll when message appears
    } catch {
      setFailedMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: messageText,
          file: imageData?.file || null,
          previewUrl: imageData?.previewUrl || null,
          uploadId,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Retry sending a failed message (STOMP WebSocket)
  const handleRetry = async (failedMsg) => {
    setFailedMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
    setIsSending(true);

    let uploadId = failedMsg.uploadId;

    try {
      if (failedMsg.file && !failedMsg.uploadId) {
        const result = await upload(failedMsg.file);
        uploadId = result.uploadId;
      }

      stompSend({
        message: failedMsg.message,
        ...(uploadId !== undefined && { attachmentUploadIds: [uploadId] }),
      });

      if (failedMsg.previewUrl) {
        URL.revokeObjectURL(failedMsg.previewUrl);
      }

      // ResizeObserver will auto-scroll when message appears
    } catch {
      setFailedMessages((prev) => [...prev, { ...failedMsg, uploadId }]);
    } finally {
      setIsSending(false);
    }
  };

  // Delete a failed message from the UI
  const handleDeleteFailedMessage = (failedMsg) => {
    if (failedMsg.previewUrl) {
      URL.revokeObjectURL(failedMsg.previewUrl);
    }
    setFailedMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
  };

  const handleKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Determine if sender label should be shown
   * @param {object} msg - Current message
   * @param {number} index - Message index
   * @param {Array} messages - All messages
   * @param {number} currentUserId - Current user ID
   * @returns {boolean}
   */
  const shouldShowSenderLabel = (msg, index, messages, currentUserId) => {
    if (msg.sender === currentUserId) return false;

    if (index === 0) return true;

    return messages[index - 1].sender !== msg.sender;
  };

  /**
   * Determine if date divider should be shown before this message
   * @param {object} msg - Current message
   * @param {number} index - Message index
   * @param {Array} messages - All messages
   * @returns {boolean}
   */
  const shouldShowDateDivider = (msg, index, messages) => {
    if (index === 0) return true;

    const currentDate = getLocalDate(msg.sendAt);
    const prevDate = getLocalDate(messages[index - 1].sendAt);
    return currentDate !== prevDate;
  };

  // Reset to list view when sheet is closed
  useEffect(() => {
    if (!isOpen) {
      setViewMode('list');
      setSelectedRoomId(null);
      setSelectedRoomName('');
      setInputText('');

      // Cleanup using functional updates to avoid dependency issues
      setAttachedImage((prev) => {
        if (prev?.previewUrl) {
          URL.revokeObjectURL(prev.previewUrl);
        }
        return null;
      });

      setFailedMessages((prev) => {
        prev.forEach((msg) => {
          if (msg.previewUrl) URL.revokeObjectURL(msg.previewUrl);
        });
        return [];
      });

      didInitialScrollRef.current = false;
      setIsNearBottom(true);
    }
  }, [isOpen]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen} dismissible={true}>
      <Drawer.Trigger asChild>
        <button
          type="button"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 hover:text-primary transition-colors"
          aria-label="채팅방 목록 열기"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-y-0 left-1/2 z-50 w-full max-w-[390px] -translate-x-1/2 bg-black/40" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 flex flex-col w-full max-w-[390px] mx-auto"
          style={{ height: '70vh' }}
        >
          {/* Drag handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 my-4" />

          {/* Header - Conditional based on view mode */}
          {viewMode === 'list' ? (
            <div className="px-8 py-2">
              <Drawer.Title className="text-base font-semibold">
                채팅방 목록
              </Drawer.Title>
            </div>
          ) : (
            <div className="px-8 py-2 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors -ml-2"
                  aria-label="채팅방 목록으로 돌아가기"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <Drawer.Title className="text-base font-semibold">
                  {selectedRoomName}
                </Drawer.Title>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )}

          {/* Content Area */}
          {viewMode === 'list' ? (
            // Chat Room List View
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                  <p className="text-sm text-gray-500">채팅방 불러오는 중...</p>
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm text-gray-600 mb-2">
                    채팅방을 불러올 수 없습니다.
                  </p>
                  <p className="text-xs text-gray-500">
                    {error?.response?.status === 401
                      ? '로그인이 필요합니다'
                      : '잠시 후 다시 시도해주세요'}
                  </p>
                </div>
              ) : chatRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm text-gray-500">
                    생성된 채팅방이 없습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatRooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => handleRoomClick(room.id, room.name)}
                      className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-base">{room.name}</h4>
                        {room.lastUpdatedAt && (
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {formatKoreanTimestamp(room.lastUpdatedAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {room.lastMessage === '' && room.lastUpdatedAt
                          ? '(첨부파일)'
                          : room.lastMessage || '첫 메시지를 보내보세요!'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Message History View
            <>
              {/* Message List Area */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-5 py-4"
                onScroll={handleScroll}
              >
                {isLoadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                    <p className="text-sm text-gray-500">
                      메시지 불러오는 중...
                    </p>
                  </div>
                ) : isMessagesError ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-sm text-gray-600 mb-2">
                      일시적으로 메시지를 불러올 수 없습니다. 재시도해주세요.
                    </p>
                    <p className="text-xs text-gray-500">
                      {messagesError?.response?.status === 401
                        ? '로그인이 필요합니다'
                        : '잠시 후 다시 시도해주세요'}
                    </p>
                  </div>
                ) : messages.length === 0 && failedMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-sm text-gray-500">
                      아직 메시지가 없습니다.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Infinite Scroll Load Indicator */}
                    {isFetchingNextPage && (
                      <div className="flex items-center justify-center py-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                        <p className="text-xs text-gray-500">
                          이전 메시지 불러오는 중...
                        </p>
                      </div>
                    )}

                    {/* Message List (wrapped for ResizeObserver) */}
                    <div ref={contentRef} className="space-y-3">
                      {messages.map((msg, index) => {
                        const isCurrentUser = msg.sender === currentUserId;
                        const timeString = formatMessageTime(msg.sendAt);
                        const showSenderLabel = shouldShowSenderLabel(
                          msg,
                          index,
                          messages,
                          currentUserId
                        );
                        const showDateDivider = shouldShowDateDivider(
                          msg,
                          index,
                          messages
                        );

                        return (
                          <div key={msg.id}>
                            {/* Date Divider */}
                            {showDateDivider && (
                              <div className="flex justify-center my-4">
                                <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                                  {formatMessageDate(msg.sendAt)}
                                </div>
                              </div>
                            )}

                            {/* Sender Label */}
                            {showSenderLabel && (
                              <div className="text-xs text-gray-500 mb-1 ml-1">
                                익명{msg.senderNumber}
                              </div>
                            )}

                            {/* Message Container */}
                            <div
                              className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                              {/* Timestamp (left side for current user) */}
                              {isCurrentUser && timeString && (
                                <span className="text-xs text-gray-500 mb-1">
                                  {timeString}
                                </span>
                              )}

                              {/* Message Bubble */}
                              <div className="max-w-[70%]">
                                <div
                                  className={`rounded-2xl px-4 py-2 ${
                                    isCurrentUser
                                      ? 'bg-primary text-white rounded-br-sm'
                                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                                  }`}
                                >
                                  {msg.message && (
                                    <p className="text-sm">{msg.message}</p>
                                  )}

                                  {/* File Attachments */}
                                  {msg.files?.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                      {msg.files.map((file) => (
                                        <div key={file.id}>
                                          {file.fileType === 'IMAGE' ? (
                                            <img
                                              src={file.fileUrl}
                                              alt="첨부 이미지"
                                              className="rounded-lg max-w-full"
                                              loading="eager"
                                            />
                                          ) : (
                                            <a
                                              href={file.fileUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs underline"
                                            >
                                              첨부파일 보기
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Timestamp (right side for other users) */}
                              {!isCurrentUser && timeString && (
                                <span className="text-xs text-gray-500 mb-1">
                                  {timeString}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Failed Messages */}
                    {failedMessages.map((failedMsg) => (
                      <div key={`failed-${failedMsg.id}`} className="mt-3">
                        <div className="flex items-end justify-end gap-2">
                          {/* Retry/Delete buttons (left side, like timestamp) */}
                          <div className="flex flex-col items-end gap-1 mb-1">
                            <button
                              type="button"
                              onClick={() => handleRetry(failedMsg)}
                              disabled={
                                isSending || isUploading || !isConnected
                              }
                              className="text-xs text-red-500 hover:underline disabled:opacity-40"
                            >
                              재전송
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteFailedMessage(failedMsg)
                              }
                              className="text-xs text-gray-500 hover:underline"
                            >
                              삭제
                            </button>
                          </div>

                          {/* Message Bubble */}
                          <div className="max-w-[70%]">
                            <div className="rounded-2xl px-4 py-2 bg-gray-300 text-white rounded-br-sm">
                              {failedMsg.message && (
                                <p className="text-sm">{failedMsg.message}</p>
                              )}
                              {isSafePreviewUrl(failedMsg.previewUrl) && (
                                <div className="mt-2">
                                  <img
                                    src={failedMsg.previewUrl}
                                    alt="첨부 이미지"
                                    className="rounded-lg max-w-full"
                                    loading="eager"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Scroll to Bottom Button (shown when not near bottom) */}
              {!isNearBottom && (
                <button
                  type="button"
                  onClick={() => {
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollTop =
                        scrollContainerRef.current.scrollHeight;
                    }
                  }}
                  className="absolute bottom-24 right-8 bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
                  aria-label="맨 아래로 스크롤"
                >
                  <ChevronDown className="w-5 h-5 text-gray-700" />
                </button>
              )}

              {/* Input Area */}
              <div className="border-t border-gray-200 px-5 py-4">
                <input
                  ref={attachFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                  onChange={handleAttachImageChange}
                />

                {/* Attached image preview */}
                {attachedImage &&
                  isSafePreviewUrl(attachedImage.previewUrl) && (
                    <div className="relative w-24 aspect-square mx-2 mb-3">
                      <img
                        src={attachedImage.previewUrl}
                        alt="첨부 이미지"
                        className="w-full h-full object-cover"
                        loading="eager"
                      />
                      <button
                        type="button"
                        onClick={removeAttachedImage}
                        className="absolute top-1 right-1 bg-black/40 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}

                <div className="flex items-end gap-2">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isConnected ? '메시지를 입력하세요...' : '연결 중...'
                    }
                    disabled={!isConnected}
                    className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    rows={1}
                    maxLength={500}
                  />
                  <button
                    type="button"
                    onClick={() => attachFileInputRef.current?.click()}
                    disabled={
                      !!attachedImage ||
                      isSending ||
                      isUploading ||
                      !isConnected
                    }
                    className="p-2 text-gray-500 hover:text-primary disabled:opacity-40 transition-colors"
                    aria-label="이미지 첨부"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={
                      (!inputText.trim() && !attachedImage) ||
                      isSending ||
                      isUploading ||
                      !isConnected
                    }
                    className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isSending || isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
