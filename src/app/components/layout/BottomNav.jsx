import { Home, Plus, /* List, */ Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: '/home', icon: Home, label: '홈' },
    { path: '/repo-select', icon: Plus, label: '이력서 생성' },
    // { path: '/interviews', icon: List, label: '면접 목록' },
    { path: '/settings', icon: Settings, label: '설정' },
  ];

  return (
    <nav className="fixed bottom-0 left-[50%] translate-x-[-50%] max-w-[390px] w-full bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[44px] min-h-[44px]"
            >
              <Icon
                className={`w-6 h-6 ${
                  isActive ? 'text-primary' : 'text-gray-500'
                }`}
                strokeWidth={1.5}
              />
              <span
                className={`text-xs ${
                  isActive ? 'text-primary font-medium' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
