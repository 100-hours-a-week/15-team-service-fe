import { forwardRef } from 'react';
import { parseYAMLToResume } from '@/app/lib/utils';

/**
 * ParsedResumeViewer displays AI-generated resume with structured project information.
 * Optionally renders personal info sections when resumeProfile is provided.
 *
 * @typedef {Object} Project
 * @property {string} name - Project name
 * @property {string} repoUrl - GitHub repository URL
 * @property {string} description - Project description
 * @property {string[]} techStack - Technologies used
 *
 * @typedef {Object} ParsedResumeViewerProps
 * @property {string} yamlContent - YAML (or JSON) string containing resume data
 * @property {object} [resumeProfile] - Personal info from GET /resumes/{id}/profile
 */

const EMPLOYMENT_TYPE_LABELS = {
  FULL_TIME: '정규직',
  CONTRACT: '계약직',
  INTERN: '인턴',
  FREELANCE: '프리랜서',
};

const EDUCATION_TYPE_LABELS = {
  BACHELOR: '학사',
  MASTER: '석사',
  DOCTOR: '박사',
  ASSOCIATE: '전문학사',
  HIGH_SCHOOL: '고졸',
};

const EDUCATION_STATUS_LABELS = {
  GRADUATED: '졸업',
  ENROLLING: '재학중',
  DROPPED_OUT: '중퇴',
  COMPLETED: '수료',
  GRADUATION_POSTPONED: '졸업유예',
};

/**
 * @type {import('react').ForwardRefExoticComponent<ParsedResumeViewerProps & import('react').RefAttributes<HTMLDivElement>>}
 */
export const ParsedResumeViewer = forwardRef(
  ({ yamlContent, resumeProfile }, ref) => {
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

    if (!resumeProfile && projects.length === 0) {
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
        {resumeProfile && (
          <>
            {/* Header: name + contact */}
            <div className="mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-gray-900 mb-1">{resumeProfile.name}</h2>
              {resumeProfile.phoneNumber && (
                <p className="text-sm text-gray-500">
                  {resumeProfile.phoneCountryCode
                    ? `${resumeProfile.phoneCountryCode} `
                    : ''}
                  {resumeProfile.phoneNumber}
                </p>
              )}
            </div>

            {/* 자기소개 */}
            {resumeProfile.introduction && (
              <div className="mb-6">
                <h3 className="mb-2 text-primary">자기소개</h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {resumeProfile.introduction}
                </p>
              </div>
            )}

            {/* 경력 */}
            {resumeProfile.experiences?.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-primary">경력</h3>
                <div className="space-y-4">
                  {resumeProfile.experiences.map((exp, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {exp.companyName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {exp.startAt} ~{' '}
                          {exp.isCurrentlyWorking ? '현재' : exp.endAt}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {exp.position}
                        {exp.department ? ` · ${exp.department}` : ''}
                        {exp.employmentType
                          ? ` · ${EMPLOYMENT_TYPE_LABELS[exp.employmentType] || exp.employmentType}`
                          : ''}
                      </p>
                      {exp.responsibilities && (
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                          {exp.responsibilities}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 학력 */}
            {resumeProfile.educations?.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-primary">학력</h3>
                <div className="space-y-2">
                  {resumeProfile.educations.map((edu, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {edu.institution}
                        </span>
                        <span className="text-xs text-gray-400">
                          {edu.startAt} ~ {edu.endAt}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {edu.major}
                        {edu.educationType
                          ? ` · ${EDUCATION_TYPE_LABELS[edu.educationType] || edu.educationType}`
                          : ''}
                        {edu.status
                          ? ` · ${EDUCATION_STATUS_LABELS[edu.status] || edu.status}`
                          : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 활동 */}
            {resumeProfile.activities?.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-primary">활동</h3>
                <div className="space-y-2">
                  {resumeProfile.activities.map((act, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {act.title}
                        </span>
                        {act.year && (
                          <span className="text-xs text-gray-400">
                            {act.year}
                          </span>
                        )}
                      </div>
                      {act.organization && (
                        <p className="text-sm text-gray-600">
                          {act.organization}
                        </p>
                      )}
                      {act.description && (
                        <p className="text-sm text-gray-700">
                          {act.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 자격증 */}
            {resumeProfile.certificates?.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-primary">자격증</h3>
                <div className="space-y-2">
                  {resumeProfile.certificates.map((cert, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {cert.name}
                        </span>
                        {cert.issuedAt && (
                          <span className="text-xs text-gray-400">
                            {cert.issuedAt}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {cert.issuer}
                        {cert.score ? ` · ${cert.score}점` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 프로젝트 (YAML) */}
        {projects.length > 0 && (
          <>
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
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed whitespace-pre-line">
                    {project.description}
                  </p>

                  {/* Tech Stack */}
                  {project.techStack && project.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          data-tech-badge="true"
                          className="inline-flex items-center justify-center h-6 px-3 bg-blue-50 text-primary rounded-lg text-sm"
                        >
                          <span data-tech-badge-text="true" className="block">
                            {tech}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }
);

ParsedResumeViewer.displayName = 'ParsedResumeViewer';
