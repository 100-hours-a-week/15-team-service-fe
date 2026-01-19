import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Video } from "lucide-react";
import { Button } from "../components/common/Button";
import { BottomNav } from "../components/layout/BottomNav";
import { DropdownMenu } from "../components/common/DropdownMenu";

/**
 * Phase 1: 레이아웃 및 컴포넌트 구조
 *
 * @typedef {import('@/app/types').Resume} Resume
 */

export function HomePage() {
  const navigate = useNavigate();

  // Phase 1: Mock 데이터 (하드코딩)
  /** @type {Resume[]} */
  const resumes = [
    {
      id: "12345",
      name: "2025-12-23_12345",
      createdAt: "2025-12-23",
      position: "백엔드",
      company: "한화시스템",
    },
    {
      id: "12346",
      name: "2025-12-22_12346",
      createdAt: "2025-12-22",
      position: "프론트엔드",
      company: "",
    },
  ];

  // Phase 1: 빈 핸들러 (동작 없음)
  const handleDeleteResume = () => {};
  const handleEditResumeName = () => {};

  const user = {
    name: "예지",
    position: "백엔드",
    profileImage: null,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-5 py-6">
        <div className="max-w-[390px] mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="mb-2">{user.name}님 어서오세요!</h2>
              <p className="text-sm text-gray-600">희망 포지션: {user.position}</p>
            </div>
            {user.profileImage && <div className="w-16 h-16 rounded-full bg-gray-200" />}
          </div>
        </div>
      </header>

      {/* Resume List */}
      <div className="px-5 py-6">
        <div className="max-w-[390px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3>내 이력서</h3>
            <Button
              variant="ghost"
              onClick={() => navigate("/repo-select")}
              className="text-primary px-3 py-1 min-h-0 h-auto"
            >
              + 새로 만들기
            </Button>
          </div>

          {resumes.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
              <p className="text-gray-500 mb-4">생성한 이력서가 없습니다.</p>
              <Button variant="primary" onClick={() => navigate("/repo-select")}>
                이력서 생성
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} onDelete={handleDeleteResume} onEdit={handleEditResumeName} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

/**
 * Phase 1: UI 구조만 렌더링 (모달, 이벤트 핸들러 제외)
 *
 * @typedef {Object} ResumeCardProps
 * @property {Resume} resume
 * @property {() => void} [onDelete] - Phase 1에서는 미사용
 * @property {() => void} [onEdit] - Phase 1에서는 미사용
 */

/**
 * @param {ResumeCardProps} props
 */
function ResumeCard({ resume }) {
  const navigate = useNavigate();

  // Phase 1: 빈 핸들러 (동작 없음)
  const handleViewResume = () => {
    navigate(`/resume/${resume.id}`);
  };

  const handleStartInterview = () => {
    navigate(`/interview/start?resumeId=${resume.id}`);
  };

  const menuItems = [
    {
      label: "이력서명 수정",
      onClick: () => {}, // Phase 1: 빈 핸들러
    },
    {
      label: "이력서 삭제",
      onClick: () => {}, // Phase 1: 빈 핸들러
      variant: "danger",
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200 relative">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="mb-1 truncate">{resume.name}</h4>
          <p className="text-sm text-gray-500">{resume.createdAt}</p>
        </div>

        <DropdownMenu items={menuItems} />
      </div>

      {/* Position and Company Chips */}
      <div className="flex items-center gap-2 mb-3">
        <span className="px-3 py-1 bg-blue-50 text-primary rounded-full text-xs">{resume.position}</span>
        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
          {resume.company || "미지정"}
        </span>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={handleViewResume}>
          <FileText className="w-4 h-4" strokeWidth={1.5} />
          이력서 보기
        </Button>
        <Button variant="primary" className="flex-1" onClick={handleStartInterview}>
          <Video className="w-4 h-4" strokeWidth={1.5} />
          모의 면접
        </Button>
      </div>
    </div>
  );
}
