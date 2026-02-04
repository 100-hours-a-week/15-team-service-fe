import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * .env.test 파일 로드
 */
const envPath = path.resolve(__dirname, 'e2e', '.env.test');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 테스트 디렉토리
  testDir: './e2e/specs',

  // 테스트 파일 패턴
  testMatch: '**/*.spec.ts',

  // 전체 테스트 타임아웃 (60초)
  timeout: 60000,

  // expect 타임아웃 (10초)
  expect: {
    timeout: 10000,
  },

  // 병렬 실행 설정
  fullyParallel: true,

  // CI에서 test.only 남겨두면 실패
  forbidOnly: !!process.env.CI,

  // CI에서 실패 시 재시도 횟수
  retries: process.env.CI ? 2 : 0,

  // 워커 수 (CI에서는 1개로 제한)
  workers: process.env.CI ? 1 : undefined,

  // 리포터 설정
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  // 전역 설정 (실제 GitHub 로그인 후 storageState 저장)
  globalSetup: './e2e/support/global-setup.ts',

  // 공통 설정
  use: {
    // 베이스 URL
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',

    // 인증 상태 저장 경로
    storageState: './e2e/.auth/user.json',

    // 트레이스 설정 (실패 시에만)
    trace: 'on-first-retry',

    // 스크린샷 (실패 시에만)
    screenshot: 'only-on-failure',

    // 비디오 (실패 시에만)
    video: 'on-first-retry',

    // 액션 타임아웃
    actionTimeout: 15000,

    // 네비게이션 타임아웃
    navigationTimeout: 30000,
  },

  // 프로젝트 설정 (모바일 Chrome만 - 390px 뷰포트)
  projects: [
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],

  // 개발 서버 설정 (로컬 테스트 시)
  webServer: process.env.CI
    ? undefined
    : {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
});
