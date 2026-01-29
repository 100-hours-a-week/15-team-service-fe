import { cn } from '@/app/lib/utils';

/**
 * @typedef {Object} StepProgressProps
 * @property {number} current
 * @property {number} total
 * @property {string} [className]
 */

/**
 * @param {StepProgressProps} props
 */
export const StepProgress = ({ current, total, className }) => {
  const percentage = (current / total) * 100;

  return (
    <div className={cn('bg-white px-5 py-4', className)}>
      <div className="max-w-[390px] mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-primary">
            {current} / {total}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
