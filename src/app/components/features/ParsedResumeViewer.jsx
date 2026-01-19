import React, { forwardRef } from 'react';
import { Mail, Phone, Github } from 'lucide-react';
import { parseYAMLToResume } from '@/app/lib/utils';

/**
 * @typedef {Object} ParsedResumeViewerProps
 * @property {string} yamlContent
 */

/**
 * @type {React.ForwardRefExoticComponent<ParsedResumeViewerProps & React.RefAttributes<HTMLDivElement>>}
 */
export const ParsedResumeViewer = forwardRef(
  ({ yamlContent }, ref) => {
    const resume = parseYAMLToResume(yamlContent);

    if (!resume) {
      return (
        <div className="p-8 text-center text-gray-500">
          이력서를 불러올 수 없습니다.
        </div>
      );
    }

    return (
      <div ref={ref} className="bg-white p-8 max-w-[390px] mx-auto rounded-2xl border border-gray-200">
        {/* Header Section */}
        <div className="border-b-2 border-primary pb-4 mb-6">
          <h1 className="text-2xl font-bold mb-1">{resume.name}</h1>
          <p className="text-lg text-gray-700">{resume.position}</p>
          {resume.company && (
            <p className="text-gray-600">{resume.company}</p>
          )}
        </div>

        {/* Contact Section */}
        {resume.profile && (
          <div className="mb-6">
            <h3 className="mb-3 text-primary">연락처</h3>
            <div className="space-y-2 text-sm">
              {resume.profile.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{resume.profile.email}</span>
                </div>
              )}
              {resume.profile.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{resume.profile.phone}</span>
                </div>
              )}
              {resume.profile.github && (
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-gray-500" />
                  <a href={resume.profile.github} className="text-primary hover:underline">
                    {resume.profile.github}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Education Section */}
        {resume.education && resume.education.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-primary">학력</h3>
            <div className="space-y-3">
              {resume.education.map((edu, index) => (
                <div key={index}>
                  <h4 className="font-semibold">{edu.degree}</h4>
                  <p className="text-sm text-gray-700">{edu.school}</p>
                  <p className="text-sm text-gray-500">{edu.period}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Section */}
        {resume.experience && resume.experience.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-primary">경력</h3>
            <div className="space-y-4">
              {resume.experience.map((exp, index) => (
                <div key={index}>
                  <h4 className="font-semibold">{exp.title}</h4>
                  <p className="text-sm text-gray-700">{exp.company}</p>
                  <p className="text-sm text-gray-500 mb-1">{exp.period}</p>
                  <p className="text-sm">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Section */}
        {resume.skills && resume.skills.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-primary">기술 스택</h3>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-50 text-primary rounded-lg text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects Section */}
        {resume.projects && resume.projects.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-primary">프로젝트</h3>
            <div className="space-y-4">
              {resume.projects.map((project, index) => (
                <div key={index}>
                  <h4 className="font-semibold">{project.name}</h4>
                  <p className="text-sm text-gray-500 mb-1">{project.period}</p>
                  <p className="text-sm mb-2">{project.description}</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">기술:</span> {project.tech_stack}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

ParsedResumeViewer.displayName = 'ParsedResumeViewer';
