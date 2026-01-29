import { cn } from '@/app/lib/utils';

/**
 * SelectGrid Component
 * @template T
 * @typedef {Object} SelectGridProps
 * @property {T[]} items - Array of items to display
 * @property {T | string | number | null} selected - Currently selected item or item ID
 * @property {(item: T | string) => void} onSelect - Callback when item is selected
 * @property {(item: T) => import('react').ReactNode} [renderItem] - Custom render function
 * @property {(item: T) => string | number} [getKey] - Function to extract unique key from item
 * @property {(item: T) => string | number} [getValue] - Function to extract value for comparison
 * @property {number} [columns=2] - Number of grid columns
 * @property {string} [className] - Additional CSS classes
 */

/**
 * @template T
 * @param {SelectGridProps<T>} props
 */
export function SelectGrid({
  items,
  selected,
  onSelect,
  renderItem = (item) => item,
  getKey = (item) => (typeof item === 'object' && item.id ? item.id : item),
  getValue = (item) => (typeof item === 'object' && item.id ? item.id : item),
  columns = 2,
  className,
}) {
  return (
    <div className={cn('grid gap-3', `grid-cols-${columns}`, className)}>
      {items.map((item) => {
        const key = getKey(item);
        const value = getValue(item);
        const isSelected = selected === value;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(value)}
            className={cn(
              'p-4 rounded-xl border-2 transition-all min-h-[56px]',
              isSelected
                ? 'border-primary bg-blue-50 text-primary'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            {renderItem(item)}
          </button>
        );
      })}
    </div>
  );
}
