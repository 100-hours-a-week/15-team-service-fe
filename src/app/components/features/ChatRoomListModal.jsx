import React, { useState } from 'react';
import { Button } from '../common/Button';

/**
 * Mock data for chat rooms
 * @type {Array<{id: string, name: string, lastMessage: string, lastMessageAt: string}>}
 */
const CHAT_ROOMS = [
  {
    id: 'backend',
    name: '백엔드',
    lastMessage: '면접 준비 잘 되고 있나요?',
    lastMessageAt: '2026.01.20 오후 2:30',
  },
  {
    id: 'frontend',
    name: '프론트엔드',
    lastMessage: 'React 질문 있으신 분?',
    lastMessageAt: '2026.01.20 오후 1:15',
  },
  {
    id: 'devops',
    name: 'DevOps',
    lastMessage: 'Docker 컨테이너 설정 공유합니다',
    lastMessageAt: '2026.01.19 오후 11:20',
  },
  {
    id: 'fullstack',
    name: '풀스택',
    lastMessage: '프로젝트 같이 하실 분 구합니다',
    lastMessageAt: '2026.01.19 오후 8:45',
  },
  {
    id: 'data',
    name: '데이터',
    lastMessage: 'SQL 최적화 팁 공유',
    lastMessageAt: '2026.01.19 오후 3:30',
  },
  {
    id: 'ai',
    name: 'AI',
    lastMessage: '머신러닝 스터디 모집',
    lastMessageAt: '2026.01.18 오후 5:10',
  },
  {
    id: 'security',
    name: '보안',
    lastMessage: 'OWASP Top 10 정리자료',
    lastMessageAt: '2026.01.17 오후 2:00',
  },
  {
    id: 'mobile',
    name: '모바일',
    lastMessage: 'Flutter vs React Native',
    lastMessageAt: '2026.01.16 오후 4:20',
  },
];

/**
 * ChatRoomListModal Component
 *
 * Displays a dialog with a list of chat rooms when the message button is clicked.
 * Uses Radix UI Dialog with app-container scoped overlay.
 *
 * Implementation decisions:
 * - Portal: Renders to #app-container (NOT document.body)
 * - Dialog positioning: absolute with center alignment (top-50% left-50% translate)
 * - Overlay: Semi-transparent black backdrop scoped to app container (absolute inset-0 bg-black/40)
 * - Width: w-[360px] to fit comfortably within 390px mobile constraint
 * - Max-height: max-h-[85vh] with overflow-y-auto for scrollable list (increased from 70vh)
 * - Card hover state: hover:bg-gray-50 for visual feedback
 * - Text truncation: truncate class on last message to prevent overflow
 * - Click handler: Empty for now (to be implemented with actual chat navigation)
 * - Touch target: min-w-[44px] min-h-[44px] for accessibility
 *
 * @returns {JSX.Element} Message button with chat room list dialog
 */
export function ChatRoomListModal() {
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Handle chat room card click
   * TODO: Implement navigation to specific chat room
   * @param {string} roomId - Chat room ID
   */
  const handleRoomClick = (roomId) => {
    // To be implemented: navigate to chat room
    // Currently no action (waiting for backend integration)
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 hover:text-primary transition-colors"
          aria-label="채팅방 목록 열기"
        >
          <div
            className="w-[360px] max-w-[90vw] rounded-xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">채팅방</h3>
              <button
                className="text-sm text-gray-500"
                onClick={() => setOpen(false)}
              >
                닫기
              </button>
            </div>

            <p className="text-sm text-gray-600">
            </p>
          </div>

          <div className="space-y-3">
            {CHAT_ROOMS.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => handleRoomClick(room.id)}
                className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {/* Header: Room name and timestamp */}
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-base">{room.name}</h4>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {room.lastMessageAt}
                  </span>
                </div>

                {/* Last message preview */}
                <p className="text-sm text-gray-600 truncate">
                  {room.lastMessage}
                </p>
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
