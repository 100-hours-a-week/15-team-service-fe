import React from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { BottomNav } from "../../components/layout/BottomNav";
import { DropdownMenu } from "../../components/common/DropdownMenu";
import { Collapsible, CollapsibleContent } from "../../components/ui/collapsible";
import { Pagination, PaginationContent, PaginationItem, PaginationEllipsis } from "../../components/ui/pagination";
import {
  POSITIONS,
  INTERVIEW_TYPE_LABELS,
  SORT_LABELS,
  ITEMS_PER_PAGE,
  FILTER_ALL_LABEL,
  FILTER_UNSPECIFIED_LABEL,
} from "@/app/constants";
import { extractUniqueCompanies, sortInterviews, generatePageNumbers, cn } from "@/app/lib/utils";

/**
 * @typedef {import('@/app/types').Interview} Interview
 * @typedef {import('@/app/types').InterviewType} InterviewType
 * @typedef {import('@/app/types').SortOption} SortOption
 */

export function InterviewListPage() {
  const navigate = useNavigate();

  const interviews = [
    {
      id: "1",
      name: "2025-12-23_기술_백엔드_한화시스템",
      date: "2025-12-23",
      type: "technical",
      position: "백엔드",
      company: "한화시스템",
    },
    {
      id: "2",
      name: "2025-12-22_인성_백엔드_미지정",
      date: "2025-12-22",
      type: "personality",
      position: "백엔드",
      company: "",
    },
  ];

  const filterType = "all";
  const filterPosition = "all";
  const filterCompany = "all";
  const filterSort = "newest";
  const currentPage = 1;
  const isFilterOpen = false;

  const uniqueCompanies = [];
  const filteredAndSortedInterviews = interviews;
  const totalPages = 1;
  const paginatedInterviews = interviews;
  const pageNumbers = [1];

  const activeFilterCount = 0;

  const handleTypeChange = () => {};
  const handlePositionChange = () => {};
  const handleCompanyChange = () => {};
  const handleSortChange = () => {};
  const handleResetFilters = () => {};
  const handlePageChange = () => {};
  const handleDeleteInterview = () => {};

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Filter Button */}
      <header className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="max-w-[390px] mx-auto flex items-center justify-between">
          <h1>면접 목록</h1>
          <button
            onClick={() => {}}
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
                <label className="block mb-2 text-sm font-medium text-gray-700">유형</label>
                <div className="flex bg-white rounded-xl border border-gray-200 p-1">
                  <button
                    onClick={() => handleTypeChange("all")}
                    className={cn(
                      "flex-1 px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px]",
                      filterType === "all" ? "bg-primary text-white" : "text-gray-600"
                    )}
                  >
                    {FILTER_ALL_LABEL}
                  </button>
                  <button
                    onClick={() => handleTypeChange("technical")}
                    className={cn(
                      "flex-1 px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px]",
                      filterType === "technical" ? "bg-primary text-white" : "text-gray-600"
                    )}
                  >
                    {INTERVIEW_TYPE_LABELS.technical}
                  </button>
                  <button
                    onClick={() => handleTypeChange("personality")}
                    className={cn(
                      "flex-1 px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px]",
                      filterType === "personality" ? "bg-primary text-white" : "text-gray-600"
                    )}
                  >
                    {INTERVIEW_TYPE_LABELS.personality}
                  </button>
                </div>
              </div>

              {/* Position Filter */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">직무</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePositionChange("all")}
                    className={cn(
                      "px-3 py-2 text-sm rounded-xl border transition-all min-h-[44px]",
                      filterPosition === "all"
                        ? "border-primary bg-blue-50 text-primary"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    {FILTER_ALL_LABEL}
                  </button>
                  {POSITIONS.map((position) => (
                    <button
                      key={position}
                      onClick={() => handlePositionChange(position)}
                      className={cn(
                        "px-3 py-2 text-sm rounded-xl border transition-all min-h-[44px]",
                        filterPosition === position
                          ? "border-primary bg-blue-50 text-primary"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      )}
                    >
                      {position}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Filter (Data-driven) */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">회사</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCompanyChange("all")}
                    className={cn(
                      "px-3 py-2 text-sm rounded-xl border transition-all min-h-[44px]",
                      filterCompany === "all"
                        ? "border-primary bg-blue-50 text-primary"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    {FILTER_ALL_LABEL}
                  </button>
                  {uniqueCompanies.map((company) => (
                    <button
                      key={company}
                      onClick={() => handleCompanyChange(company)}
                      className={cn(
                        "px-3 py-2 text-sm rounded-xl border transition-all min-h-[44px]",
                        filterCompany === company
                          ? "border-primary bg-blue-50 text-primary"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      )}
                    >
                      {company}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">정렬</label>
                <div className="flex bg-white rounded-xl border border-gray-200 p-1">
                  {Object.entries(SORT_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => handleSortChange(key)}
                      className={cn(
                        "flex-1 px-3 py-2 text-sm rounded-lg transition-colors min-h-[44px]",
                        filterSort === key ? "bg-primary text-white" : "text-gray-600"
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
              <button onClick={handleResetFilters} className="px-4 py-2 text-sm text-primary hover:underline">
                필터 초기화
              </button>
            </div>
          ) : (
            paginatedInterviews.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} onDelete={handleDeleteInterview} />
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
                {/* Previous Button */}
                <PaginationItem>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 rounded-lg min-h-[44px] min-w-[44px] transition-colors",
                      currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"
                    )}
                    aria-label="이전 페이지"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </PaginationItem>

                {/* Page Numbers */}
                {pageNumbers.map((pageNum, index) => (
                  <PaginationItem key={`page-${index}`}>
                    {pageNum === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <button
                        onClick={() => handlePageChange(pageNum)}
                        className={cn(
                          "flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px] text-sm transition-colors",
                          currentPage === pageNum ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
                        )}
                        aria-label={`페이지 ${pageNum}`}
                        aria-current={currentPage === pageNum ? "page" : undefined}
                      >
                        {pageNum}
                      </button>
                    )}
                  </PaginationItem>
                ))}

                {/* Next Button */}
                <PaginationItem>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 rounded-lg min-h-[44px] min-w-[44px] transition-colors",
                      currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100"
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

/**
 * @typedef {Object} InterviewCardProps
 * @property {Interview} interview
 * @property {(id: string) => void} onDelete
 */

/**
 * @param {InterviewCardProps} props
 */
const InterviewCard = React.memo(
  ({ interview, onDelete }) => {
    const navigate = useNavigate();
    /** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} */
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleNameChange = useCallback((e) => {
      // 내용명 변경 로직
    }, []);

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
      toast.success("면접 기록이 삭제되었습니다");
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
        label: "내용명 변경",
        onClick: handleNameChange,
      },
      {
        label: "삭제",
        onClick: handleDelete,
        variant: "danger",
      },
    ];

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
                <span>{interview.date}</span>
              </div>
            </div>

            <DropdownMenu items={menuItems} />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span
              className={`px-3 py-1 rounded-full ${
                interview.type === "technical" ? "bg-purple-50 text-purple-700" : "bg-green-50 text-green-700"
              }`}
            >
              {interview.type === "technical" ? "기술" : "인성"}
            </span>
            <span className="px-3 py-1 bg-blue-50 text-primary rounded-full">{interview.position}</span>
            {interview.company && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">{interview.company}</span>
            )}
          </div>
        </div>

        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="면접 기록 삭제"
          description="정말 이력서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          confirmText="삭제"
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    // interview.id가 같으면 재렌더링 하지 않음
    return prevProps.interview.id === nextProps.interview.id;
  }
);

InterviewCard.displayName = "InterviewCard";
