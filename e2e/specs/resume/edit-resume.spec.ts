import { test, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

test.describe('Resume AI Edit Scenario', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
  });

  test('이력서 상세 진입 및 AI 에이전트로 내용 수정', async ({ page }) => {
    // 1. 홈 페이지에서 이력서 카드 찾기
    await basePage.goto('/');

    const resumeCards = page
      .locator('div.bg-white.rounded-2xl.p-4')
      .filter({ has: page.getByRole('button', { name: /프로젝트 요약 보기/ }) });

    const count = await resumeCards.count();
    if (count === 0) {
      console.log('이력서가 없어 AI 수정 시나리오를 건너뜁니다.');
      return;
    }

    // 2. 첫 번째 이력서의 "프로젝트 요약 보기" 클릭 → /resume/:id 진입
    const firstCard = resumeCards.first();
    await firstCard.getByRole('button', { name: /프로젝트 요약 보기/ }).click();
    await expect(page).toHaveURL(/\/resume\/\d+/, { timeout: 10000 });

    // 3. 이력서 로딩 대기 (QUEUED/PROCESSING → SUCCEEDED)
    await basePage.waitForLoadingComplete();

    // 4. 탭 UI 확인 (미리보기 / YAML)
    await expect(page.getByRole('button', { name: '미리보기' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'YAML' })).toBeVisible();

    // 5. YAML 탭으로 전환하여 이력서 내용 확인
    await page.getByRole('button', { name: 'YAML' }).click();
    const yamlBlock = page.locator('pre');
    await expect(yamlBlock).toBeVisible();

    // 6. AI 챗봇 버튼 클릭 (aria-label="AI 챗봇 열기")
    const chatbotButton = page.getByRole('button', { name: 'AI 챗봇 열기' });
    try {
      await chatbotButton.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      console.log('AI 챗봇 기능이 비활성화 상태입니다. 시나리오를 건너뜁니다.');
      return;
    }
    await chatbotButton.click();

    // 7. ChatbotBottomSheet UI 확인
    await expect(page.getByText('CommitMe Assistant')).toBeVisible();
    await expect(
      page.getByText('수정하고 싶은 내용을 입력해주세요.')
    ).toBeVisible();

    // 8. 수정 요청 전송 (BE → AI: POST /api/v2/resume/edit, Planner-Executor 패턴)
    const chatInput = page.getByPlaceholder(
      '수정하고 싶은 내용을 입력해주세요.'
    );
    await chatInput.fill('Redis 캐싱 관련 내용을 추가해줘');
    await page.getByRole('button', { name: '메시지 전송' }).click();

    // 9. 사용자 메시지 표시 확인
    await expect(
      page.getByText('Redis 캐싱 관련 내용을 추가해줘')
    ).toBeVisible({ timeout: 5000 });

    // 10. AI 응답 완료 확인 (classify → plan → edit → evaluate → callback)
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast).toContainText('업데이트가 반영되었습니다', {
      timeout: 120000,
    });
  });
});
