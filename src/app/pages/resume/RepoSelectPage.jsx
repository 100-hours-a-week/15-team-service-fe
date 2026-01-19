import { useNavigate } from "react-router-dom";
import { Search, Lock, RefreshCw, ChevronDown } from "lucide-react";
import { TopAppBar } from "../../components/layout/TopAppBar";
import { Button } from "../../components/common/Button";
import { REPO_SORT_OPTIONS } from "@/app/constants";

/**
 * Maximum number of repositories that can be selected
 *
 * Implementation Decision: Set to 6 based on user requirement
 * - Users can select up to 6 repositories for resume generation
 * - Enforced through handleRepoClick handler with toast notification
 * - Visual feedback: disabled state on unselected cards when limit reached
 */
const MAX_REPO_SELECTION = 6;

/**
 * @typedef {import('@/app/types').Repository} Repository
 * @typedef {import('@/app/types').RepoSortOption} RepoSortOption
 * @typedef {'loading' | 'empty' | 'error' | 'loaded'} ViewState
 */

/** @type {Repository[]} */
const MOCK_REPOS = [
  {
    id: 12345,
    name: "commitme-web",
    owner: "yezi",
    isPrivate: false,
    updatedAt: "2025-12-20",
  },
  {
    id: 67890,
    name: "backend-api",
    owner: "yezi",
    isPrivate: true,
    updatedAt: "2025-12-15",
  },
  {
    id: 11223,
    name: "data-pipeline",
    owner: "yezi",
    isPrivate: false,
    updatedAt: "2025-12-10",
  },
  {
    id: 44556,
    name: "mobile-app",
    owner: "yezi",
    isPrivate: true,
    updatedAt: "2025-12-05",
  },
];

export function RepoSelectPage() {
  const navigate = useNavigate();

  const viewState = "loaded";
  const selectedRepos = [];
  const sortOption = 'recent';
  const showSortMenu = false;
  const searchQuery = "";
  const filterPrivate = "all";
  const repos = MOCK_REPOS;
  const sortedAndFilteredRepos = MOCK_REPOS;

  const handleRepoClick = () => {};
  const handleSortChange = () => {};
  const handleContinue = () => {};

  // Loading State
  if (viewState === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopAppBar title="레포지토리 선택" showBack />
        <div className="px-5 py-6">
          <div className="max-w-[390px] mx-auto space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (viewState === "empty") {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopAppBar title="레포지토리 선택" showBack />
        <div className="flex flex-col items-center justify-center px-5 py-24">
          <div className="max-w-[390px] w-full bg-white rounded-2xl p-8 text-center border border-gray-200">
            <p className="text-gray-500 mb-4">표시할 레포지토리가 없습니다.</p>
            <Button variant="ghost" onClick={() => {}}>
              새로고침
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (viewState === "error") {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopAppBar title="레포지토리 선택" showBack />
        <div className="flex flex-col items-center justify-center px-5 py-24">
          <div className="max-w-[390px] w-full bg-white rounded-2xl p-8 text-center border border-gray-200 space-y-4">
            <p className="text-gray-500">레포지토리를 불러오지 못했습니다</p>
            <Button variant="primary" onClick={() => {}}>
              재시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loaded State
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <TopAppBar title="레포지토리 선택" showBack />

      <div className="px-5 py-6">
        <div className="max-w-[390px] mx-auto space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="레포 검색"
              value={searchQuery}
              onChange={() => {}}
              className="w-full min-h-[44px] pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-xl border border-gray-200 p-1">
              <button
                onClick={() => {}}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filterPrivate === "all" ? "bg-primary text-white" : "text-gray-600"
                }`}
              >
                전체
              </button>
              <button
                onClick={() => {}}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filterPrivate === "public" ? "bg-primary text-white" : "text-gray-600"
                }`}
              >
                Public
              </button>
              <button
                onClick={() => {}}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filterPrivate === "private" ? "bg-primary text-white" : "text-gray-600"
                }`}
              >
                Private
              </button>
            </div>

            <div className="relative ml-auto">
              <button
                onClick={() => {}}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm min-h-[44px]"
              >
                <span>{REPO_SORT_OPTIONS[sortOption]}</span>
                <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
              </button>

              {/* Dropdown Menu */}
              {showSortMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-10">
                  {Object.keys(REPO_SORT_OPTIONS).map(option => (
                    <button
                      key={option}
                      onClick={() => handleSortChange(option)}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl transition-colors ${
                        sortOption === option ? 'bg-blue-50 text-primary font-medium' : 'text-gray-700'
                      }`}
                    >
                      {REPO_SORT_OPTIONS[option]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Repository List */}
          <div className="space-y-3">
            {sortedAndFilteredRepos.map((repo) => {
              const isSelected = selectedRepos.some(r => r.id === repo.id);
              const isMaxReached = selectedRepos.length >= MAX_REPO_SELECTION;
              /**
               * Disable logic: Only unselected cards are disabled when limit reached
               * - Selected cards remain clickable for deselection
               * - Allows users to swap repositories
               */
              const isDisabled = !isSelected && isMaxReached;

              return (
                <button
                  key={repo.id}
                  onClick={() => handleRepoClick(repo)}
                  disabled={isDisabled}
                  /**
                   * Card styling decisions:
                   * - Selected: border-primary bg-blue-50 (existing pattern)
                   * - Disabled: bg-gray-50 opacity-60 cursor-not-allowed
                   *   * Gray background for clear disabled state
                   *   * 60% opacity maintains readability while showing disabled state
                   *   * cursor-not-allowed for immediate visual feedback
                   *   * No hover effect to reinforce non-interactive state
                   * - Default: border-gray-200 with hover effect
                   */
                  className={`w-full bg-white rounded-2xl p-4 border-2 transition-all text-left relative ${
                    isSelected
                      ? "border-primary bg-blue-50"
                      : isDisabled
                      ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {/* Disabled text colors maintain visual hierarchy:
                            - Title: text-gray-400 (lighter than normal black)
                            - Metadata: text-gray-300 (even lighter)
                            - Lock icon: text-gray-300 (matches metadata) */}
                        <h4 className={isDisabled ? "text-gray-400" : ""}>
                          {repo.name}
                        </h4>
                        {repo.isPrivate && (
                          <Lock
                            className={`w-3.5 h-3.5 ${isDisabled ? "text-gray-300" : "text-gray-500"}`}
                            strokeWidth={1.5}
                          />
                        )}
                      </div>
                      <p className={`text-sm ${isDisabled ? "text-gray-300" : "text-gray-500"}`}>
                        #{repo.id}
                      </p>
                    </div>

                    {/* Checkbox */}
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className={`w-5 h-5 border-2 rounded-md ${
                          isDisabled ? "border-gray-200 bg-gray-50" : "border-gray-300"
                        }`} />
                      )}
                    </div>
                  </div>

                  <div className={`text-sm ${isDisabled ? "text-gray-300" : "text-gray-600"}`}>
                    <span>{repo.owner}</span>
                    <span className="mx-2">·</span>
                    <span>{repo.updatedAt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4">
        <div className="max-w-[390px] mx-auto">
          {/* Selection Progress Indicator
              Implementation Decisions:
              - Positioned above continue button for contextual awareness
              - Shows "X/6개 선택됨" format for clear progress indication
              - Only visible when at least 1 repo is selected (reduces visual clutter)
              - Count turns text-primary font-medium when limit reached (positive visual emphasis)
              - Centered text matches button alignment for visual consistency */}
          {selectedRepos.length > 0 && (
            <p className="text-sm text-gray-600 text-center mb-2">
              <span className={selectedRepos.length >= MAX_REPO_SELECTION ? "text-primary font-medium" : ""}>
                {selectedRepos.length}/{MAX_REPO_SELECTION}
              </span>
              개 선택됨
            </p>
          )}

          <Button variant="primary" fullWidth onClick={handleContinue} disabled={selectedRepos.length === 0}>
            {selectedRepos.length === 0
              ? '레포지토리를 선택하세요'
              : `${selectedRepos.length}개 레포로 계속`}
          </Button>
        </div>
      </div>
    </div>
  );
}
