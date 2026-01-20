import React from 'react';
import { cn } from '@/app/lib/utils';

/**
 * @typedef {import('@/app/types').ScriptEntry} ScriptEntry
 * @typedef {import('@/app/types').Speaker} Speaker
 */

/**
 * @typedef {Object} InterviewScriptProps
 * @property {ScriptEntry[]} entries
 * @property {string} [maxHeight='400px']
 * @property {string} [className]
 */

/**
 * @param {Speaker} speaker
 * @returns {string}
 */
const getSpeakerColor = (speaker) => {
  switch (speaker) {
    case '면접관':
      return 'text-gray-900';
    case '유저':
      return 'text-blue-600';
    case 'AI':
      return 'text-green-600';
    default:
      return 'text-gray-900';
  }
};

/**
 * @param {{ entry: ScriptEntry }} props
 */
const ScriptEntryItem = React.memo(({ entry }) => (
  <div className="text-sm">
    <p className="text-gray-900">
      <span className="text-primary font-medium">[{entry.timestamp}]</span>{' '}
      <span className={`font-medium ${getSpeakerColor(entry.speaker)}`}>
        {entry.speaker}:
      </span>{' '}
      <span className={entry.speaker === 'AI' ? 'text-gray-600 italic' : 'text-gray-700'}>
        {entry.content}
      </span>
    </p>
  </div>
));

ScriptEntryItem.displayName = 'ScriptEntryItem';

/**
 * @param {InterviewScriptProps} props
 */
export const InterviewScript = ({
  entries,
  maxHeight = '400px',
  className
}) => {
  return (
    <div className={cn("bg-white rounded-2xl p-5 border border-gray-200", className)}>
      <h3 className="mb-4">면접 스크립트</h3>
      <div className="space-y-3 overflow-y-auto" style={{ maxHeight }}>
        {entries.map((entry, idx) => (
          <ScriptEntryItem key={`${entry.timestamp}-${idx}`} entry={entry} />
        ))}
      </div>
    </div>
  );
};
