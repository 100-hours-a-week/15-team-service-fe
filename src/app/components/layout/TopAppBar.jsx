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
      <div className="max-w-[390px] mx-auto flex items-center justify-between h-14 px-5">
        {showBack ? (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" strokeWidth={1.5} />
          </button>
        ) : (
          <div className="w-24" />
        )}

        <h1
          className={`flex-1 text-center px-2 ${noTruncate ? '' : 'truncate'}`}
        >
          {title}
        </h1>

        <div className="w-9 flex justify-end">{action}</div>
      </div>
    </header>
  );
}
