import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * @typedef {Object} TopAppBarProps
 * @property {string} title
 * @property {boolean} [showBack=false]
 * @property {React.ReactNode} [action]
 */

/**
 * @param {TopAppBarProps} props
 */
export function TopAppBar({ title, showBack = false, action }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="max-w-[390px] mx-auto flex items-center justify-between h-14 px-5">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" strokeWidth={1.5} />
          </button>
        ) : (
          <div className="w-10" />
        )}

        <h1 className="flex-1 text-center truncate px-2">{title}</h1>

        <div className="w-24 flex justify-end">{action}</div>
      </div>
    </header>
  );
}
