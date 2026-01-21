import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/app/lib/utils';

/**
 * @typedef {import('@/app/types').MenuItem} MenuItem
 */

/**
 * @typedef {Object} DropdownMenuProps
 * @property {MenuItem[]} items
 * @property {React.ReactNode} [trigger]
 * @property {string} [className]
 */

/**
 * @param {DropdownMenuProps} props
 */
export const DropdownMenu = ({ items, trigger, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  /**
   * @param {MenuItem} item
   * @param {React.MouseEvent} e
   */
  const handleItemClick = (item, e) => {
    e.stopPropagation();
    item.onClick(e);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          'p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center',
          className
        )}
      >
        {trigger || (
          <MoreVertical className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20 min-w-[140px]">
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={(e) => handleItemClick(item, e)}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                  item.variant === 'danger' && 'text-[#EF4444]'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
