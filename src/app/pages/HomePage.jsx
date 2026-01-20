import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/common/Button";
import { BottomNav } from "../components/layout/BottomNav";
import { DropdownMenu } from "../components/common/DropdownMenu";
import { ConfirmDialog } from "../components/modals/ConfirmDialog";
import { EditTextDialog } from "../components/modals/EditTextDialog";
import { ChatRoomListModal } from "../components/features/ChatRoomListModal";
import { useUser } from "../hooks/useUser";

/**
 * @typedef {import('@/app/types').Resume} Resume
 * @typedef {import('@/app/types').UserProfile} UserProfile
 */

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useUser();

  /** @type {[Resume[], React.Dispatch<React.SetStateAction<Resume[]>>]} */
  const [resumes, setResumes] = useState([
    {
      id: "12345",
      name: "2025-12-23_12345",
      createdAt: "2025-12-23",
      position: "백엔드",
      company: "회사1",
    },
    {
      id: "12346",
      name: "2025-12-22_12346",
      createdAt: "2025-12-22",
      position: "프론트엔드",
      company: "",
    },
  ]);

  /** @type {[{id: string, name: string} | null, React.Dispatch<React.SetStateAction<{id: string, name: string} | null>>]} */
  const [editTarget, setEditTarget] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  /** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleEditResumeName = useCallback((id, newName) => {
    setResumes((prev) =>
      prev.map((resume) => (resume.id === id ? { ...resume, name: newName } : resume))
    );
    toast.success("이력서명이 수정되었습니다");
  }, []);

  const handleDeleteResume = useCallback((id) => {
    setResumes((prev) => prev.filter((resume) => resume.id !== id));
    toast.success("이력서가 삭제되었습니다");
  }, []);

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
            <div className="flex items-center gap-2">
              <ChatRoomListModal />
              {user.profileImage && <div className="w-16 h-16 rounded-full bg-gray-200" />}
            </div>
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
 * @typedef {Object} ResumeCardProps
 * @property {Resume} resume
 * @property {(id: string) => void} onDelete
 * @property {(id: string, newName: string) => void} onEdit
 */

/**
 * @param {ResumeCardProps} props
 */
const ResumeCard = React.memo(
  ({ resume, onDelete, onEdit }) => {
    const navigate = useNavigate();

    /** @type {[{id: string, name: string} | null, React.Dispatch<React.SetStateAction<{id: string, name: string} | null>>]} */
    const [editTarget, setEditTarget] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    /** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} */
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleViewResume = useCallback(() => {
      navigate(`/resume/${resume.id}`);
    }, [navigate, resume.id]);

    const handleStartInterview = useCallback(() => {
      navigate(`/interview/start?resumeId=${resume.id}`);
    }, [navigate, resume.id]);

    const handleResumeNameEdit = useCallback(
      (e) => {
        e.stopPropagation();
        setEditTarget({ id: resume.id, name: resume.name });
        setIsEditDialogOpen(true);
      },
      [resume.id, resume.name]
    );

    const handleConfirmEdit = useCallback(
      (newValue) => {
        if (!editTarget) return;
        onEdit(editTarget.id, newValue);
        setIsEditDialogOpen(false);
        setEditTarget(null);
      },
      [editTarget, onEdit]
    );

    const handleCancelEdit = useCallback(() => {
      setIsEditDialogOpen(false);
      setEditTarget(null);
    }, []);

    const handleDeleteClick = useCallback(
      (e) => {
        e.stopPropagation();
        setDeleteTarget(resume.id);
        setIsDeleteDialogOpen(true);
      },
      [resume.id]
    );

    const handleConfirmDelete = useCallback(() => {
      if (!deleteTarget) return;
      onDelete(deleteTarget);
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    }, [deleteTarget, onDelete]);

    const handleCancelDelete = useCallback(() => {
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    }, []);

    const menuItems = [
      {
        label: "이력서명 수정",
        onClick: handleResumeNameEdit,
      },
      {
        label: "이력서 삭제",
        onClick: handleDeleteClick,
        variant: "danger",
      },
    ];

    return (
      <>
        <div className="bg-white rounded-2xl p-4 border border-gray-200 relative">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="mb-1 truncate">{resume.name}</h4>
              <p className="text-sm text-gray-500">{resume.createdAt}</p>
            </div>

            <DropdownMenu items={menuItems} />
          </div>

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

        <EditTextDialog
          isOpen={isEditDialogOpen}
          onClose={handleCancelEdit}
          onConfirm={handleConfirmEdit}
          initialValue={editTarget?.name || ""}
          title="이력서명 수정"
          label="이력서명"
          placeholder="이력서명을 입력하세요"
          errorMessage="이력서명을 입력해주세요"
        />

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="이력서 삭제"
          description="정말 이력서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          confirmText="삭제"
          cancelText="취소"
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.resume.id === nextProps.resume.id &&
      prevProps.resume.name === nextProps.resume.name &&
      prevProps.onDelete === nextProps.onDelete &&
      prevProps.onEdit === nextProps.onEdit
    );
  }
);

ResumeCard.displayName = "ResumeCard";
