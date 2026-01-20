import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

/**
 * @typedef {Object} ButtonProps
 * @property {'primary' | 'secondary' | 'ghost' | 'danger'} [variant='primary']
 * @property {boolean} [loading]
 * @property {boolean} [fullWidth]
 * @property {string} [className]
 * @property {boolean} [disabled]
 * @property {React.ReactNode} [children]
 */

/**
 * @type {React.ForwardRefExoticComponent<ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>}
 */
export const Button = forwardRef(
  (
    {
      className,
      variant = 'primary',
      loading,
      fullWidth,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'min-h-[44px] px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

    const variants = {
      primary: 'bg-primary text-white hover:bg-[#2558CC]',
      secondary:
        'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
      danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626]',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
