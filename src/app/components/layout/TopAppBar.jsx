import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * @typedef {Object} TopAppBarProps
 * @property {string} title
 * @property {boolean} [showBack=false]
 * @property {() => void} [onBack] - Custom back handler (defaults to navigate(-1))
 * @property {boolean} [noTruncate=false] - Prevent title truncation
 * @property {React.ReactNode} [action]
 */

/**
 * @param {TopAppBarProps} props
 */
export function TopAppBar({
  title,
  showBack = false,
  onBack,
  noTruncate = false,
  action,
}) {
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate(-1));

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="relative flex items-center mx-auto h-14 px-5">
        <div className="min-w-[44px]">
          {showBack ? (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <ArrowLeft className="w-6 h-6 text-gray-900" strokeWidth={1.5} />
            </button>
          ) : null}
        </div>

        <h1
          className={`absolute left-1/2 -translate-x-1/2 text-center px-2 max-w-[calc(100%-120px)] ${noTruncate ? '' : 'truncate'} pointer-events-none`}
        >
          {title}
        </h1>

        <div className="ml-auto flex min-w-[44px] justify-end">{action}</div>
      </div>
    </header>
  );
}
