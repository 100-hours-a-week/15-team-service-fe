import React, { useState } from 'react';
import { Button } from '../common/Button';

/**
 * Temporary placeholder for ChatRoomListModal.
 * Replace with real chat room list UI when ready.
 */
export function ChatRoomListModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="h-9 px-3">
        채팅
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
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
              ChatRoomListModal 컴포넌트가 아직 구현되지 않았습니다. (빌드
              통과용)
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatRoomListModal;
