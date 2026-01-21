import React, { forwardRef } from 'react';
import { cn } from '@/app/lib/utils';

/**
 * @typedef {Object} YAMLViewerProps
 * @property {string} content
 * @property {string} [maxHeight='calc(100vh - 200px)']
 * @property {string} [className]
 */

/**
 * @type {React.ForwardRefExoticComponent<YAMLViewerProps & React.RefAttributes<HTMLDivElement>>}
 */
export const YAMLViewer = forwardRef(
  ({ content, maxHeight = 'calc(100vh - 200px)', className }, ref) => {
    return (
      <div className="px-5 py-6">
        <div
          ref={ref}
          className={cn(
            'max-w-[390px] mx-auto bg-gray-900 rounded-2xl p-4 overflow-auto',
            className
          )}
          style={{ maxHeight }}
        >
          <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
            {content}
          </pre>
        </div>
      </div>
    );
  }
);

YAMLViewer.displayName = 'YAMLViewer';
