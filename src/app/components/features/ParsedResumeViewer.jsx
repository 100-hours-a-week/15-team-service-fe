import { forwardRef } from 'react';
import { parseYAMLToResume } from '@/app/lib/utils';

/**
 * ParsedResumeViewer displays AI-generated resume with structured project information
 * Backend data structure: { jobId, status, resume: { projects: [...] } }
 *
 * @typedef {Object} Project
 * @property {string} name - Project name
 * @property {string} repoUrl - GitHub repository URL
 * @property {string} description - Project description
 * @property {string[]} techStack - Technologies used
 *
 * @typedef {Object} ParsedResumeViewerProps
 * @property {string} yamlContent - JSON string containing resume data
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

  // 두 가지 구조 모두 지원: { resume: { projects } } 또는 { projects }
  const projects = resume.resume?.projects || resume.projects || [];

  if (projects.length === 0) {
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
      <h2 className="mb-6 text-primary">프로젝트</h2>

      <div className="space-y-6">
        {projects.map((project, index) => (
          <div
            key={index}
            data-project-item="true"
            className="pb-6 border-b border-gray-200 last:border-b-0 last:pb-0"
          >
            {/* Project Name */}
            <h3 className="mb-2 text-gray-900">{project.name}</h3>

            {/* Repository URL */}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mb-3 inline-block"
              >
                {project.repoUrl}
              </a>
            )}

            {/* Description */}
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              {project.description}
            </p>

            {/* Tech Stack */}
            {project.techStack && project.techStack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech, techIndex) => (
                  <span
                    key={techIndex}
                    className="px-3 py-1 bg-blue-50 text-primary rounded-lg text-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

ParsedResumeViewer.displayName = 'ParsedResumeViewer';
