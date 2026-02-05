import { Page, expect } from '@playwright/test';

/**
 * GitHub OAuth 로그인 자동화
 *
 * 환경 변수:
 * - E2E_GITHUB_USERNAME: GitHub 테스트 계정 사용자명
 * - E2E_GITHUB_PASSWORD: GitHub 테스트 계정 비밀번호
 */
export async function loginWithGitHub(page: Page, baseURL: string) {
  const username = process.env.E2E_GITHUB_USERNAME;
  const password = process.env.E2E_GITHUB_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'E2E_GITHUB_USERNAME과 E2E_GITHUB_PASSWORD 환경 변수가 필요합니다.\n' +
      'e2e/.env.test 파일에 설정하거나 환경 변수로 전달하세요.'
    );
  }

  // 1. 앱의 온보딩 페이지로 이동
  await page.goto(baseURL);
  // networkidle 대신 DOMContentLoaded 정도로 충분하며, 
  // 이후 바로 버튼의 존재를 확인하므로 굳이 networkidle을 기다릴 필요 없음
  await page.waitForLoadState('domcontentloaded');

  // 2. GitHub 로그인 버튼 대기 및 클릭
  // 앱에서 GitHub OAuth 플로우 시작
  const githubLoginButton = page.getByRole('button', { name: /github/i });
  await githubLoginButton.waitFor({ state: 'visible', timeout: 15000 });
  await githubLoginButton.click();

  // 3. GitHub 로그인 페이지로 리다이렉트 대기
  await page.waitForURL(/github\.com\/login/, { timeout: 30000 });

  // 4. GitHub 로그인 폼 입력
  await page.fill('input[name="login"]', username);
  await page.fill('input[name="password"]', password);

  // 5. 로그인 버튼 클릭
  await page.click('input[type="submit"]');

  // 6. OAuth 권한 승인 페이지가 나타나면 승인
  // (이미 승인된 앱이면 이 단계 스킵됨)
  try {
    const authorizeButton = page.getByRole('button', { name: /authorize/i });
    await authorizeButton.click({ timeout: 5000 });
  } catch {
    // 이미 승인된 앱이면 무시
  }

  // 7. 앱으로 리다이렉트 대기 (홈 또는 회원가입 페이지)
  await page.waitForURL(
    (url) => url.origin === new URL(baseURL).origin,
    { timeout: 30000 }
  );

  // 8. 로그인 완료 확인 (홈 페이지 또는 회원가입 페이지)
  await page.waitForLoadState('load');

  console.log('✅ GitHub 로그인 성공');
}

/**
 * 로그아웃 수행
 */
export async function logout(page: Page) {
  // 설정 페이지로 이동
  await page.goto('/settings');
  await page.waitForLoadState('domcontentloaded');

  // 로그아웃 버튼 클릭
  const logoutButton = page.getByRole('button', { name: /로그아웃/i });
  await logoutButton.click();

  // 확인 다이얼로그가 있다면 확인
  try {
    const confirmButton = page.getByRole('button', { name: /확인/i });
    await confirmButton.click({ timeout: 3000 });
  } catch {
    // 확인 다이얼로그가 없으면 무시
  }

  // 온보딩 페이지로 리다이렉트 확인
  await expect(page).toHaveURL('/onboarding', { timeout: 10000 });
}
