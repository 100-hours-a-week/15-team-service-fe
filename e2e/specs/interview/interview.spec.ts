import { test, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

test.describe('Interview Scenario', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
  });

  test('면접 시작 - 유형/포지션/기업 입력 및 정보 확인', async ({ page }) => {
    await basePage.goto('/interview/start');

    // Step 1: 면접 유형 선택 (BE: interviewType → TECHNICAL/BEHAVIORAL)
    await expect(page.getByText('면접 유형을 선택하세요.')).toBeVisible();
    await expect(page.getByRole('button', { name: '다음' })).toBeDisabled();

    await page.getByRole('button', { name: '기술면접' }).click();
    await expect(page.getByRole('button', { name: '다음' })).toBeEnabled();
    await page.getByRole('button', { name: '다음' }).click();

    // Step 2: 희망 포지션 선택 (AI: position → 한글/영문 자동 매핑)
    await expect(page.getByText('희망 포지션을 선택하세요.')).toBeVisible();

    const positionButtons = page.locator('div.grid').first().locator('button');
    await expect(positionButtons.first()).toBeVisible();
    await positionButtons.first().click();

    await expect(page.getByRole('button', { name: '다음' })).toBeEnabled();
    await page.getByRole('button', { name: '다음' }).click();

    // Step 3: 희망 기업 입력 (BE: companyId, AI: company 파라미터)
    await expect(page.getByText('희망 기업을 입력하세요.')).toBeVisible();
    await page.getByPlaceholder('예: 한화시스템').fill('테스트회사');

    // 면접 정보 요약 카드 검증 (BE InterviewCreateRequest 매핑)
    await expect(page.getByText('면접 정보')).toBeVisible();
    await expect(page.getByText('기술면접')).toBeVisible();
    await expect(page.getByText('테스트회사')).toBeVisible();

    // 면접 시작 버튼 (BE: POST /interviews → AI 세션 생성)
    await expect(
      page.getByRole('button', { name: '면접 시작' })
    ).toBeVisible();
  });

  test('면접 세션 페이지 UI 검증', async ({ page }) => {
    await basePage.goto('/interview/session');

    // 종료 버튼 (BE: POST /interviews/{id}/end → AI 피드백 생성)
    await expect(page.getByRole('button', { name: '종료' })).toBeVisible();

    // 답변 입력 영역 (BE: POST /interviews/{id}/messages)
    await expect(
      page.getByPlaceholder('답변을 입력하세요...')
    ).toBeVisible();

    // 면접 질문 표시 (AI가 생성한 질문이 SSE로 전달됨)
    await expect(page.getByText('자기소개 부탁드립니다.')).toBeVisible();
  });

  test('면접 요약 페이지 UI 검증', async ({ page }) => {
    await basePage.goto('/interview/summary');

    // 면접 종료 안내
    await expect(page.getByText('면접이 종료되었습니다')).toBeVisible();
    await expect(page.getByText('진행 시간:')).toBeVisible();

    // 홈으로 버튼
    await expect(
      page.getByRole('button', { name: '홈으로' })
    ).toBeVisible();
  });
});
