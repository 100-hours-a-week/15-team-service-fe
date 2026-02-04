import { test, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

/**
 * Smoke 테스트 - 핵심 경로 검증
 * 매 PR마다 실행되어 기본 기능이 동작하는지 확인
 *
 * 태그: @smoke
 */
test.describe('Smoke Tests @smoke', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
  });

  test('홈 페이지 진입 및 기본 UI 확인', async ({ page }) => {
    // 홈 페이지로 이동
    await basePage.goto('/home');

    // 페이지 로드 완료 대기
    await basePage.waitForPageLoad();

    // 하단 네비게이션 존재 확인
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();

    // 네비게이션 항목 확인
    await expect(nav.getByRole('link', { name: /홈/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /이력서/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /면접/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /설정/i })).toBeVisible();
  });

  test('하단 네비게이션으로 페이지 이동', async ({ page }) => {
    await basePage.goto('/home');

    // 이력서 탭 클릭
    await basePage.clickBottomNav('이력서');
    await expect(page).toHaveURL(/\/resumes/);

    // 면접 탭 클릭
    await basePage.clickBottomNav('면접');
    await expect(page).toHaveURL(/\/interviews/);

    // 설정 탭 클릭
    await basePage.clickBottomNav('설정');
    await expect(page).toHaveURL(/\/settings/);

    // 홈 탭 클릭
    await basePage.clickBottomNav('홈');
    await expect(page).toHaveURL(/\/home/);
  });

  test('설정 페이지에서 프로필 정보 표시', async ({ page }) => {
    await basePage.goto('/settings');
    await basePage.waitForPageLoad();

    // 프로필 섹션 존재 확인
    const profileSection = page.locator('[data-testid="profile-section"]').or(
      page.getByText(/프로필/i)
    );
    await expect(profileSection.first()).toBeVisible();

    // 로그아웃 버튼 존재 확인
    const logoutButton = page.getByRole('button', { name: /로그아웃/i });
    await expect(logoutButton).toBeVisible();
  });

  test('로그아웃 후 온보딩 페이지로 이동', async ({ page, context }) => {
    await basePage.goto('/settings');
    await basePage.waitForPageLoad();

    // 로그아웃 버튼 클릭
    const logoutButton = page.getByRole('button', { name: /로그아웃/i });
    await logoutButton.click();

    // 확인 다이얼로그가 있다면 확인
    try {
      await basePage.confirmDialog();
    } catch {
      // 확인 다이얼로그가 없으면 무시
    }

    // 온보딩 페이지로 이동 확인
    await expect(page).toHaveURL(/\/(onboarding)?$/, { timeout: 10000 });

    // 스토리지 상태 초기화 (다음 테스트를 위해)
    await context.clearCookies();
  });
});

/**
 * 인증 없이 접근 가능한 페이지 테스트
 */
test.describe('Public Pages @smoke', () => {
  // 인증 상태 사용하지 않음
  test.use({ storageState: { cookies: [], origins: [] } });

  test('비로그인 상태에서 온보딩 페이지 표시', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 온보딩 또는 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/(onboarding)?$/);

    // GitHub 로그인 버튼 존재 확인
    const githubButton = page.getByRole('button', { name: /github/i });
    await expect(githubButton).toBeVisible();
  });

  test('비로그인 상태에서 보호된 페이지 접근 시 리다이렉트', async ({ page }) => {
    // 홈 페이지 직접 접근 시도
    await page.goto('/home');
    await page.waitForLoadState('networkidle');

    // 온보딩 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/\/(onboarding)?$/, { timeout: 10000 });
  });
});
