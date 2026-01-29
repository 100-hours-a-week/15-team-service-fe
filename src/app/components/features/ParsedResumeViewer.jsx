import { forwardRef } from 'react';
import { parseYAMLToResume } from '@/app/lib/utils';

/**
 * ParsedResumeViewer displays AI-generated resume with tech stack and project experiences
 * Backend data structure: { tech_stack: string[], project_experiences: string[] }
 *
 * @typedef {Object} ParsedResumeViewerProps
 * @property {string} yamlContent
 */

/**
 * @type {import('react').ForwardRefExoticComponent<ParsedResumeViewerProps & import('react').RefAttributes<HTMLDivElement>>}
 */
export const ParsedResumeViewer = forwardRef(({ yamlContent }, ref) => {
  const resume = parseYAMLToResume(yamlContent);

  if (!resume) {
    return (
      <div className="p-8 text-center text-gray-500">
        이력서를 불러올 수 없습니다.
      </div>
    );
  }

  // Check if resume has any content to display (snake_case from backend)
  const hasTechStack = resume.tech_stack && resume.tech_stack.length > 0;
  const hasProjectExperiences =
    resume.project_experiences && resume.project_experiences.length > 0;

  if (!hasTechStack && !hasProjectExperiences) {
    return (
      <div className="p-8 text-center text-gray-500">
        이력서 내용이 없습니다.
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="bg-white p-8 max-w-[390px] mx-auto rounded-2xl border border-gray-200"
    >
      {/* Tech Stack Section */}
      {hasTechStack && (
        <div className="mb-6">
          <h3 className="mb-3 text-primary">기술 스택</h3>
          <div className="flex flex-wrap gap-2">
            {resume.tech_stack.map((tech, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 text-primary rounded-lg text-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Project Experiences Section */}
      {hasProjectExperiences && (
        <div className="mb-6">
          <h3 className="mb-3 text-primary">프로젝트 경험</h3>
          <ul className="space-y-3">
            {resume.project_experiences.map((experience, index) => (
              <li
                key={index}
                className="text-sm text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary before:font-bold"
              >
                {experience}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

ParsedResumeViewer.displayName = 'ParsedResumeViewer';
