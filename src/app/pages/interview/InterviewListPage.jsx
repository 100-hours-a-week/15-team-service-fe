import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/app/lib/toast';
import { BottomNav } from '../../components/layout/BottomNav';
import { DropdownMenu } from '../../components/common/DropdownMenu';
import { ConfirmDialog } from '../../components/modals/ConfirmDialog';
import {
  Collapsible,
  CollapsibleContent,
} from '../../components/ui/collapsible';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationEllipsis,
} from '../../components/ui/pagination';
import {
  POSITIONS,
  INTERVIEW_TYPE_LABELS,
  SORT_LABELS,
  FILTER_ALL_LABEL,
} from '@/app/constants';
import { cn } from '@/app/lib/utils';
import { useInterviews } from '@/app/hooks/queries/useInterviewQueries';
import {
  useDeleteInterview,
  useRenameInterview,
} from '@/app/hooks/mutations/useInterviewMutations';

const ITEMS_PER_PAGE = 10;

export function InterviewListPage() {
  const navigate = useNavigate();

  const [filterType, setFilterType] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterSort, setFilterSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data, isLoading, error } = useInterviews();
  const deleteInterviewMutation = useDeleteInterview();

  const interviews = data?.data || [];

  const uniqueCompanies = useMemo(() => {
    const companies = interviews
      .map((i) => i.companyName)
      .filter((c) => c && c.trim());
    return [...new Set(companies)];
  }, [interviews]);

  const filteredAndSortedInterviews = useMemo(() => {
    let result = [...interviews];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((i) => {
        const type = i.interviewType?.toLowerCase();
        if (filterType === 'technical') return type === 'technical';
        if (filterType === 'personality') return type === 'behavioral';
        return true;
      });
    }

    // Filter by position
    if (filterPosition !== 'all') {
      result = result.filter((i) => i.positionName === filterPosition);
    }

    // Filter by company
    if (filterCompany !== 'all') {
      result = result.filter((i) => i.companyName === filterCompany);
    }

    // Sort
    result.sort((a, b) => {
      if (filterSort === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (filterSort === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (filterSort === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

    return result;
  }, [interviews, filterType, filterPosition, filterCompany, filterSort]);

  const totalPages = Math.ceil(filteredAndSortedInterviews.length / ITEMS_PER_PAGE);
  const paginatedInterviews = filteredAndSortedInterviews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const pageNumbers = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis');
      }
    }
    return pages;
  }, [totalPages, currentPage]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterType !== 'all') count++;
    if (filterPosition !== 'all') count++;
    if (filterCompany !== 'all') count++;
    return count;
  }, [filterType, filterPosition, filterCompany]);

  const handleTypeChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handlePositionChange = (position) => {
    setFilterPosition(position);
    setCurrentPage(1);
  };

  const handleCompanyChange = (company) => {
    setFilterCompany(company);
    setCurrentPage(1);
  };

  const handleSortChange = (sort) => {
    setFilterSort(sort);
  };

  const handleResetFilters = () => {
    setFilterType('all');
    setFilterPosition('all');
    setFilterCompany('all');
    setFilterSort('newest');
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDeleteInterview = async (id) => {
    try {
      await deleteInterviewMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete interview:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <p className="text-red-500">면접 목록을 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Filter Button */}
      <header className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="max-w-[390px] mx-auto flex items-center justify-between">
          <h1>면접 목록</h1>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-gray-200 rounded-xl min-h-[44px] min-w-[44px] hover:border-primary transition-colors"
            aria-label="필터"
          >
            <Filter className="w-5 h-5" strokeWidth={1.5} />
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full font-medium">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Filter Panel (Collapsible) */}
      <Collapsible open={isFilterOpen}>
        <CollapsibleContent>
          <div className="bg-white border-b border-gray-200 px-5 py-4">
            <div className="max-w-[390px] mx-auto space-y-4">
              {/* Type Filter */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  유형
                </label>
                <div className="flex bg-white rounded-xl border border-gray-200 p-1">
                  <button
                    onClick={() => handleTypeChange('all')}
                    className={cn(
                      'flex-1 px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px]',
                      filterType === 'all'
                        ? 'bg-primary text-white'
                        : 'text-gray-600'
                    )}
                  >
                    {FILTER_ALL_LABEL}
                  </button>
                  <button
                    onClick={() => handleTypeChange('technical')}
                    className={cn(
                      'flex-1 px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px]',
                      filterType === 'technical'
                        ? 'bg-primary text-white'
                        : 'text-gray-600'
                    )}
                  >
                    {INTERVIEW_TYPE_LABELS.technical}
                  </button>
                  <button
                    onClick={() => handleTypeChange('personality')}
                    className={cn(
                      'flex-1 px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px]',
                      filterType === 'personality'
                        ? 'bg-primary text-white'
                        : 'text-gray-600'
                    )}
                  >
                    {INTERVIEW_TYPE_LABELS.personality}
                  </button>
                </div>
              </div>

              {/* Position Filter */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  직무
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePositionChange('all')}
                    className={cn(
                      'px-3 py-2 text-sm rounded-xl border transition-all min-h-[44px]',
                      filterPosition === 'all'
                        ? 'border-primary bg-blue-50 text-primary'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                  >
                    {FILTER_ALL_LABEL}
                  </button>
                  {POSITIONS.map((position) => (
                    <button
                      key={position}
                      onClick={() => handlePositionChange(position)}
                      className={cn(
                        'px-3 py-2 text-sm rounded-xl border transition-all min-h-[44px]',
                        filterPosition === position
                          ? 'border-primary bg-blue-50 text-primary'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      )}
                    >
                      {position}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Filter (Data-driven) */}
              {uniqueCompanies.length > 0 && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    회사
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleCompanyChange('all')}
                      className={cn(
                        'px-3 py-2 text-sm rounded-xl border transition-all min-h-[44px]',
                        filterCompany === 'all'
                          ? 'border-primary bg-blue-50 text-primary'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      )}
                    >
                      {FILTER_ALL_LABEL}
                    </button>
                    {uniqueCompanies.map((company) => (
                      <button
                        key={company}
                        onClick={() => handleCompanyChange(company)}
                        className={cn(
                          'px-3 py-2 text-sm rounded-xl border transition-all min-h-[44px]',
                          filterCompany === company
                            ? 'border-primary bg-blue-50 text-primary'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        )}
                      >
                        {company}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sort Filter */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  정렬
                </label>
                <div className="flex bg-white rounded-xl border border-gray-200 p-1">
                  {Object.entries(SORT_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => handleSortChange(key)}
                      className={cn(
                        'flex-1 px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px]',
                        filterSort === key
                          ? 'bg-primary text-white'
                          : 'text-gray-600'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={handleResetFilters}
                className="w-full px-4 py-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors min-h-[44px]"
              >
                필터 초기화
              </button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Interview List */}
      <div className="px-5 py-6">
        <div className="max-w-[390px] mx-auto space-y-3">
          {interviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
              <p className="text-gray-500">완료된 면접이 없습니다.</p>
            </div>
          ) : filteredAndSortedInterviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 space-y-3">
              <p className="text-gray-500">필터 조건에 맞는 면접이 없습니다.</p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-sm text-primary hover:underline"
              >
                필터 초기화
              </button>
            </div>
          ) : (
            paginatedInterviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                interview={interview}
                onDelete={handleDeleteInterview}
              />
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 pb-6">
          <div className="max-w-[390px] mx-auto">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 rounded-lg min-h-[44px] min-w-[44px] transition-colors',
                      currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                    aria-label="이전 페이지"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </PaginationItem>

                {pageNumbers.map((pageNum, index) => (
                  <PaginationItem key={`page-${index}`}>
                    {pageNum === 'ellipsis' ? (
                      <PaginationEllipsis />
                    ) : (
                      <button
                        onClick={() => handlePageChange(pageNum)}
                        className={cn(
                          'flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px] text-sm transition-colors',
                          currentPage === pageNum
                            ? 'bg-primary text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                        aria-label={`페이지 ${pageNum}`}
                        aria-current={
                          currentPage === pageNum ? 'page' : undefined
                        }
                      >
                        {pageNum}
                      </button>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 rounded-lg min-h-[44px] min-w-[44px] transition-colors',
                      currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                    aria-label="다음 페이지"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

const InterviewCard = React.memo(
  ({ interview, onDelete }) => {
    const navigate = useNavigate();
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const renameInterviewMutation = useRenameInterview();

    const handleNameChange = useCallback(
      (e) => {
        e.stopPropagation();
        const newName = prompt('새 이름을 입력하세요:', interview.name);
        if (newName && newName !== interview.name) {
          renameInterviewMutation.mutate({ id: interview.id, name: newName });
        }
      },
      [interview.id, interview.name, renameInterviewMutation]
    );

    const handleDelete = useCallback(
      (e) => {
        e.stopPropagation();
        setDeleteTarget(interview.id);
        setIsDeleteDialogOpen(true);
      },
      [interview.id]
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

    const handleCardClick = useCallback(() => {
      navigate(`/interview/detail/${interview.id}`);
    }, [navigate, interview.id]);

    const menuItems = [
      {
        label: '이름 변경',
        onClick: handleNameChange,
      },
      {
        label: '삭제',
        onClick: handleDelete,
        variant: 'danger',
      },
    ];

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    };

    const getTypeLabel = (type) => {
      if (!type) return '';
      const lowerType = type.toLowerCase();
      if (lowerType === 'technical') return '기술';
      if (lowerType === 'behavioral') return '인성';
      return type;
    };

    return (
      <>
        <div
          className="bg-white rounded-2xl p-4 border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors relative"
          onClick={handleCardClick}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="mb-1 truncate">{interview.name}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" strokeWidth={1.5} />
                <span>{formatDate(interview.createdAt)}</span>
              </div>
            </div>

            <DropdownMenu items={menuItems} />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span
              className={`px-3 py-1 rounded-full ${
                interview.interviewType?.toLowerCase() === 'technical'
                  ? 'bg-purple-50 text-purple-700'
                  : 'bg-green-50 text-green-700'
              }`}
            >
              {getTypeLabel(interview.interviewType)}
            </span>
            {interview.positionName && (
              <span className="px-3 py-1 bg-blue-50 text-primary rounded-full">
                {interview.positionName}
              </span>
            )}
            {interview.companyName && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                {interview.companyName}
              </span>
            )}
          </div>
        </div>

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="면접 기록 삭제"
          description="정말 면접 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          confirmText="삭제"
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.interview.id === nextProps.interview.id;
  }
);

InterviewCard.displayName = 'InterviewCard';
