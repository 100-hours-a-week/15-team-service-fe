import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * IntersectionObserver 기반 무한 스크롤 훅.
 * 반환된 callback ref를 sentinel 엘리먼트에 붙이면,
 * 해당 엘리먼트가 viewport에 들어올 때 fetchNextPage를 호출한다.
 *
 * callback ref를 사용해 sentinel이 처음 마운트되는 시점을
 * 자동으로 감지하므로, 목록 길이를 dep에 포함할 필요가 없다.
 *
 * @param {object} params
 * @param {function} params.fetchNextPage - 다음 페이지 요청 함수 (useInfiniteQuery)
 * @param {boolean} params.hasNextPage - 다음 페이지 존재 여부
 * @param {boolean} params.isFetching - 현재 페이지 로딩 중 여부
 * @param {string} [params.rootMargin='0px'] - IntersectionObserver rootMargin
 * @returns {function} sentinel 엘리먼트에 붙일 callback ref
 */
export function useInfiniteScroll({
  fetchNextPage,
  hasNextPage,
  isFetching,
  rootMargin = '0px',
}) {
  // ref로 최신값 유지 → observer 재등록 없이 stale closure 방지
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingRef = useRef(isFetching);
  hasNextPageRef.current = hasNextPage;
  isFetchingRef.current = isFetching;

  // sentinel 엘리먼트를 state로 관리해서 마운트 시점에 effect 재실행
  const [sentinelEl, setSentinelEl] = useState(null);
  const sentinelRef = useCallback((el) => setSentinelEl(el), []);

  useEffect(() => {
    if (!sentinelEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPageRef.current &&
          !isFetchingRef.current
        ) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin }
    );

    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [sentinelEl, fetchNextPage, rootMargin]);

  return sentinelRef;
}
