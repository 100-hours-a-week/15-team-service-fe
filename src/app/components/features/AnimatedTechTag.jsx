import { motion } from 'motion/react';
import { cn } from '@/app/lib/utils';

/**
 * Tech Tag component that triggers deletion on click.
 *
 * @param {Object} props
 * @param {string} props.tag - The tech stack name
 * @param {function} props.onDelete - Callback when the tag is clicked for deletion
 * @param {string} [props.className] - Optional extra classes
 */
export function AnimatedTechTag({ tag, onDelete, className }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        'inline-flex items-center bg-blue-50 border border-blue-100 rounded-full h-8 px-4 cursor-pointer transition-colors hover:bg-blue-100 active:bg-blue-200 select-none',
        className
      )}
      onClick={onDelete}
    >
      <span className="text-sm font-medium text-primary whitespace-nowrap">
        {tag}
      </span>
    </motion.div>
  );
}
