import { useState, useEffect } from 'react';

/**
 * 값을 지정된 delay(ms)만큼 지연시켜 반환하는 훅.
 *
 * @template T
 * @param {T} value - 디바운스할 값
 * @param {number} delay - 지연 시간 (ms)
 * @returns {T} delay 후 업데이트된 값
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
