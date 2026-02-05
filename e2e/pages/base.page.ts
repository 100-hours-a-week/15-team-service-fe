import { Page, Locator, expect } from '@playwright/test';

/**
 * 기본 Page Object - 모든 페이지 공통 메서드
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * 페이지 이동 후 네트워크 안정화 대기
   */
  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  async login() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('domcontentloaded');

    const githubLoginButton = this.page.getByRole('button', { name: /github/i });
    await githubLoginButton.waitFor({ state: 'visible', timeout: 5000 });
    await githubLoginButton.click();

    await this.page.waitForLoadState('networkidle');
    // 회원가입 페이지로 이동된 경우에는 회원가입 진행
    try {
      await this.expectPath('/signup');
      await this.page.getByRole('textbox', { name: '이름을 입력하세요' }).fill('테스트계정');
      await this.page.getByRole('combobox').click();
      await this.page.getByRole('option', { name: 'AI' }).click();
      await this.page.getByRole('textbox', { name: '-1234-5678' }).fill('010-1234-5678');
      await this.page.getByRole('checkbox').first().check();
      await this.page.getByRole('checkbox').nth(1).check();

      await this.page.getByRole('button', { name: /가입 완료/i }).click();
    } catch (e) {
      // 회원가입 페이지로 이동되지 않았다면 무시
      console.log('회원가입 페이지로 이동되지 않았습니다.');
    } finally {
      await this.expectPath('/');
    }
  }

  /**
   * 페이지 로드 완료 대기 (React Query 포함)
   */
  async waitForPageLoad() {
    // networkidle은 너무 엄격하여 HMR이나 지속적인 API 요청 시 타임아웃이 발생하기 쉬움
    await this.page.waitForLoadState('load');
  }

  /**
   * 요소가 보일 때까지 대기
   */
  async waitForVisible(locator: Locator, timeout: number = 10000) {
    await expect(locator).toBeVisible({ timeout });
  }

  /**
   * 요소가 사라질 때까지 대기
   */
  async waitForHidden(locator: Locator, timeout: number = 10000) {
    await expect(locator).toBeHidden({ timeout });
  }

  /**
   * 로딩 스피너 사라질 때까지 대기
   */
  async waitForLoadingComplete() {
    const spinner = this.page.locator('[data-testid="loading-spinner"]');
    try {
      await this.waitForHidden(spinner, 15000);
    } catch {
      // 스피너가 없으면 무시
    }
  }

  /**
   * 토스트 메시지 확인
   */
  async expectToast(message: string | RegExp) {
    const toast = this.page.locator('[data-sonner-toast]');
    await expect(toast).toContainText(message);
  }

  /**
   * 하단 네비게이션 클릭
   */
  async clickBottomNav(name: '홈' | '생성' | '면접' | '설정') {
    const nav = this.page.getByRole('navigation');
    await nav.getByRole('link', { name }).click();
    await this.waitForPageLoad();
  }

  /**
   * 뒤로가기 버튼 클릭
   */
  async clickBack() {
    const backButton = this.page.getByRole('button', { name: /뒤로/i });
    await backButton.click();
    await this.waitForPageLoad();
  }

  /**
   * 확인 다이얼로그 처리
   */
  async confirmDialog() {
    const confirmButton = this.page.getByRole('button', { name: /확인/i });
    await confirmButton.click();
  }

  /**
   * 취소 다이얼로그 처리
   */
  async cancelDialog() {
    const cancelButton = this.page.getByRole('button', { name: /취소/i });
    await cancelButton.click();
  }

  /**
   * 현재 URL 경로 확인
   */
  async expectPath(path: string) {
    await expect(this.page).toHaveURL(new RegExp(`${path}$`), { timeout: 10000 });
  }

  /**
   * 스크린샷 저장 (디버깅용)
   */
  async screenshot(name: string) {
    await this.page.screenshot({
      path: `./e2e/screenshots/${name}.png`,
      fullPage: true,
    });
  }
}
