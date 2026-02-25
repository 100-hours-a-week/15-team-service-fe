import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, FileText, MessageSquare } from 'lucide-react';

const TYPE_CONFIG = {
  RESUME: {
    Icon: FileText,
    label: '이력서 알림',
  },
  CHAT: {
    Icon: MessageSquare,
    label: '채팅 알림',
  },
};

const DEFAULT_CONFIG = {
  Icon: Bell,
  label: '알림',
};

const AUTO_DISMISS_MS = 4000;

/**
 * 알림 전용 상단 토스트 배너.
 *
 * window 커스텀 이벤트 `notification-toast`를 수신해 #app-container 상단에
 * 아이폰 알림 배너 스타일로 슬라이드-다운 표시한다.
 *
 * 이벤트 detail: { type: 'RESUME' | 'CHAT', message: string }
 *
 * - 4초 후 자동 dismiss (새 알림 도착 시 타이머 리셋)
 * - 배너 클릭으로 즉시 닫기 (X 버튼 없음 — 아이폰 스타일)
 */
export function NotificationToastBanner() {
  const [banner, setBanner] = useState(null); // { type, message }
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const dismiss = () => {
    setVisible(false);
    // transition 이 끝난 뒤 언마운트
    timerRef.current = setTimeout(() => setBanner(null), 300);
  };

  useEffect(() => {
    const handler = (event) => {
      const { type, message } = event.detail ?? {};

      // 이전 타이머 취소
      if (timerRef.current) clearTimeout(timerRef.current);

      setBanner({ type, message });
      // 다음 tick에 visible=true로 슬라이드-다운 시작
      requestAnimationFrame(() => setVisible(true));

      timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    };

    window.addEventListener('notification-toast', handler);
    return () => {
      window.removeEventListener('notification-toast', handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!banner) return null;

  const container = document.getElementById('app-container');
  if (!container) return null;

  const { Icon, label } = TYPE_CONFIG[banner.type] ?? DEFAULT_CONFIG;

  // 현재 시간 "방금" 표시 (항상 방금으로 표시)
  const timeLabel = '방금';

  return createPortal(
    <div
      className={[
        'absolute top-3 left-3 right-3 z-50',
        'flex items-center gap-3',
        'bg-white/85 backdrop-blur-xl shadow-2xl rounded-[22px] px-4 py-3 ring-1 ring-black/[0.03]',
        'cursor-pointer select-none',
        'transition-[transform,opacity]',
        visible
          ? 'translate-y-0 opacity-100 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
          : '-translate-y-full opacity-0 pointer-events-none duration-300 ease-in',
      ].join(' ')}
      onClick={dismiss}
      role="alert"
    >
      {/* 앱 아이콘 박스 */}
      <div className="w-10 h-10 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-gray-500" />
      </div>

      {/* 콘텐츠 열 */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        {/* 앱 이름 + 시간 */}
        <div className="flex items-center">
          <span className="text-xs font-medium text-gray-500">{label}</span>
          <span className="text-xs text-gray-400 ml-auto">{timeLabel}</span>
        </div>
        {/* 메시지 */}
        <p className="text-sm font-medium text-gray-900 leading-snug truncate">
          {banner.message ?? '새 알림이 도착했습니다.'}
        </p>
      </div>
    </div>,
    container
  );
}
