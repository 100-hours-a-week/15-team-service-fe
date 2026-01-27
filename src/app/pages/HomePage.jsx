import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Video, AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { BottomNav } from '../components/layout/BottomNav';
import { DropdownMenu } from '../components/common/DropdownMenu';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { EditTextDialog } from '../components/modals/EditTextDialog';
import { ChatRoomListSheet } from '../components/features/ChatRoomListSheet';
import { useUserProfile } from '@/app/hooks/queries/useUserQuery';
import { usePositions } from '@/app/hooks/queries/usePositionsQuery';
import { useResumes } from '@/app/hooks/queries/useResumeQueries';
import {
  useRenameResume,
  useDeleteResume,
} from '@/app/hooks/mutations/useResumeMutations';

/**
 * @typedef {Object} ResumeSummary
 * @property {number} resumeId
 * @property {string} name
 * @property {number} positionId
 * @property {string} positionName
 * @property {number} [companyId]
 * @property {string} [companyName]
 * @property {number} currentVersionNo
 * @property {string} updatedAt
 */

export function HomePage() {
  const navigate = useNavigate();
  const { data: profileData } = useUserProfile();
  const { data: positions = [] } = usePositions();

  // Fetch resumes from API
  const {
    data: resumesData,
    isLoading: isLoadingResumes,
    isError: isResumesError,
    refetch: refetchResumes,
  } = useResumes();

  const resumes = resumesData?.content || [];

  const displayName = profileData?.name ?? '사용자';
  const displayPosition = profileData
    ? positions.find((position) => position.id === profileData.positionId)
        ?.name || ''
    : '';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-5 py-6">
        <div className="max-w-[390px] mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="mb-2">{displayName}님 어서오세요!</h2>
              <p className="text-sm text-gray-600">
                희망 포지션: {displayPosition}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ChatRoomListSheet />
              {profileData?.profileImageUrl && (
                <div className="w-16 h-16 rounded-full bg-gray-200" />
              )}
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
              onClick={() => navigate('/repo-select')}
              className="text-primary px-3 py-1 min-h-0 h-auto"
            >
              + 새로 만들기
            </Button>
          </div>

          {isLoadingResumes ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 border border-gray-200 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
                  <div className="flex gap-2">
                    <div className="h-10 bg-gray-200 rounded flex-1" />
                    <div className="h-10 bg-gray-200 rounded flex-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : isResumesError ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
              <p className="text-gray-500">이력서를 불러오지 못했습니다</p>
              <Button variant="primary" onClick={() => refetchResumes()}>
                재시도
              </Button>
            </div>
          ) : resumes.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
              <p className="text-gray-500 mb-4">생성한 이력서가 없습니다.</p>
              <Button variant="primary" onClick={() => navigate('/repo-select')}>
                이력서 생성
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <ResumeCard key={resume.resumeId} resume={resume} />
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
 * @property {ResumeSummary} resume
 */

/**
 * @param {ResumeCardProps} props
 */
const ResumeCard = React.memo(({ resume }) => {
  const navigate = useNavigate();

  // Mutations
  const renameResumeMutation = useRenameResume();
  const deleteResumeMutation = useDeleteResume();

  // Dialog states
  const [editTarget, setEditTarget] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleViewResume = useCallback(() => {
    navigate(`/resume/${resume.resumeId}`);
  }, [navigate, resume.resumeId]);

  const handleStartInterview = useCallback(() => {
    navigate(`/interview/start?resumeId=${resume.resumeId}`);
  }, [navigate, resume.resumeId]);

  const handleResumeNameEdit = useCallback(
    (e) => {
      e.stopPropagation();
      setEditTarget({ id: resume.resumeId, name: resume.name });
      setIsEditDialogOpen(true);
    },
    [resume.resumeId, resume.name]
  );

  const handleConfirmEdit = useCallback(
    (newValue) => {
      if (!editTarget) return;
      renameResumeMutation.mutate(
        { resumeId: editTarget.id, name: newValue },
        {
          onSuccess: () => {
            setIsEditDialogOpen(false);
            setEditTarget(null);
          },
        }
      );
    },
    [editTarget, renameResumeMutation]
  );

  const handleCancelEdit = useCallback(() => {
    setIsEditDialogOpen(false);
    setEditTarget(null);
  }, []);

  const handleDeleteClick = useCallback(
    (e) => {
      e.stopPropagation();
      setDeleteTarget(resume.resumeId);
      setIsDeleteDialogOpen(true);
    },
    [resume.resumeId]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteResumeMutation.mutate(deleteTarget, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setDeleteTarget(null);
      },
    });
  }, [deleteTarget, deleteResumeMutation]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setDeleteTarget(null);
  }, []);

  const menuItems = [
    {
      label: '이력서명 수정',
      onClick: handleResumeNameEdit,
    },
    {
      label: '이력서 삭제',
      onClick: handleDeleteClick,
      variant: 'danger',
    },
  ];

  // Format date for display
  const formattedDate = resume.updatedAt
    ? new Date(resume.updatedAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : '';

  return (
    <>
      <div className="bg-white rounded-2xl p-4 border border-gray-200 relative">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="mb-1 truncate">{resume.name}</h4>
            <p className="text-sm text-gray-500">{formattedDate}</p>
          </div>

          <DropdownMenu items={menuItems} />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-blue-50 text-primary rounded-full text-xs">
            {resume.positionName}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
            {resume.companyName || '미지정'}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleViewResume}
          >
            <FileText className="w-4 h-4" strokeWidth={1.5} />
            이력서 보기
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleStartInterview}
          >
            <Video className="w-4 h-4" strokeWidth={1.5} />
            모의 면접
          </Button>
        </div>
      </div>

      <EditTextDialog
        isOpen={isEditDialogOpen}
        onClose={handleCancelEdit}
        onConfirm={handleConfirmEdit}
        initialValue={editTarget?.name || ''}
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
});

ResumeCard.displayName = 'ResumeCard';
