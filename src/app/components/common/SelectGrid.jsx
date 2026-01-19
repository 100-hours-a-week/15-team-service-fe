import React from 'react';
import { cn } from '@/app/lib/utils';

/**
 * @template T
 * @typedef {Object} SelectGridProps
 * @property {T[]} items
 * @property {T | null} selected
 * @property {(item: T) => void} onSelect
 * @property {(item: T) => React.ReactNode} [renderItem]
 * @property {number} [columns=2]
 * @property {string} [className]
 */

/**
 * @template {string} T
 * @param {SelectGridProps<T>} props
 */
export function SelectGrid({
  items,
  selected,
  onSelect,
  renderItem = (item) => item,
  columns = 2,
  className
}) {
  return (
    <div className={cn("grid gap-3", `grid-cols-${columns}`, className)}>
      {items.map((item) => (
        <button
          key={item}
          onClick={() => onSelect(item)}
          className={cn(
            "p-4 rounded-xl border-2 transition-all min-h-[56px]",
            selected === item
              ? "border-primary bg-blue-50 text-primary"
              : "border-gray-200 bg-white hover:border-gray-300"
          )}
        >
          {renderItem(item)}
        </button>
      ))}
    </div>
  );
}
