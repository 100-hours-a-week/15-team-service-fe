import React from 'react';
import { cn } from '@/app/lib/utils';

/**
 * @typedef {import('@/app/types').EvaluationData} EvaluationData
 */

/**
 * @typedef {Object} EvaluationCardProps
 * @property {EvaluationData} data
 * @property {string} [className]
 */

/**
 * @typedef {Object} EvaluationSectionProps
 * @property {string} title
 * @property {string} titleColor
 * @property {React.ReactNode} children
 */

/**
 * @param {EvaluationSectionProps} props
 */
const EvaluationSection = ({
  title,
  titleColor,
  children
}) => (
  <div>
    <h4 className={cn("mb-2", titleColor)}>{title}</h4>
    {children}
  </div>
);

/**
 * @typedef {Object} BulletListProps
 * @property {string[]} items
 * @property {string} bulletColor
 */

/**
 * @param {BulletListProps} props
 */
const BulletList = ({ items, bulletColor }) => (
  <ul className="space-y-1.5 text-sm text-gray-700">
    {items.map((item, idx) => (
      <li key={`${item.substring(0, 20)}-${idx}`} className="flex items-start gap-2">
        <span className={cn(bulletColor, "mt-1")}>•</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

/**
 * @param {EvaluationCardProps} props
 */
export const EvaluationCard = ({ data, className }) => {
  return (
    <div className={cn("bg-white rounded-2xl p-5 border border-gray-200", className)}>
      <h3 className="mb-4">전체 평가</h3>

      <div className="space-y-4">
        <EvaluationSection title="총평" titleColor="text-gray-900">
          <p className="text-sm text-gray-700">{data.summary}</p>
        </EvaluationSection>

        <EvaluationSection title="잘한 점" titleColor="text-[#16A34A]">
          <BulletList items={data.strengths} bulletColor="text-[#16A34A]" />
        </EvaluationSection>

        <EvaluationSection title="개선점" titleColor="text-[#EF4444]">
          <BulletList items={data.improvements} bulletColor="text-[#EF4444]" />
        </EvaluationSection>

        <EvaluationSection title="다음 액션" titleColor="text-primary">
          <BulletList items={data.nextActions} bulletColor="text-primary" />
        </EvaluationSection>
      </div>
    </div>
  );
};
