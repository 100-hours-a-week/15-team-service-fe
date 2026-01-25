import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Drawer } from 'vaul';

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

export function ChatRoomListSheet() {
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Handle chat room card click
   * TODO: Implement navigation to specific chat room
   * @param {string} roomId - Chat room ID
   */
  const handleRoomClick = () => {
    setIsOpen(false);
  };

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

          {/* Header */}
          <div className="px-5 pb-4 border-b border-gray-200">
            <Drawer.Title className="text-base font-semibold">
              채팅방 목록
            </Drawer.Title>
          </div>

          {/* Scrollable room list */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
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
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
