import { describe, expect, it } from 'vitest';

import { cn, formatTime } from '../app/lib/utils';

describe('utils', () => {
  it('formatTime은 분 초 형식으로 반환한다', () => {
    expect(formatTime(0)).toBe('0분 0초');
    expect(formatTime(65)).toBe('1분 5초');
    expect(formatTime(125)).toBe('2분 5초');
  });

  it('cn은 truthy 클래스만 결합한다', () => {
    const result = cn('btn', false, ['active', null], {
      hidden: false,
      ok: true,
    });
    expect(result).toBe('btn active ok');
  });
});
