import { chromium, FullConfig } from '@playwright/test';
import { loginWithGitHub } from './auth-helpers';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_FILE = path.join(__dirname, '../.auth/user.json');

/**
 * 전역 설정 - 테스트 시작 전 1회 실행
 * 실제 GitHub 계정으로 로그인 후 storageState 저장
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:5173';

  // .auth 디렉토리 생성
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // 이미 유효한 인증 상태가 있으면 재사용
  if (fs.existsSync(AUTH_FILE)) {
    const stats = fs.statSync(AUTH_FILE);
    const hoursSinceModified = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);

    // 24시간 이내에 생성된 인증 상태면 재사용
    if (hoursSinceModified < 24) {
      console.log('✅ 기존 인증 상태 재사용');
      return;
    }
  }

  console.log('🔐 GitHub 로그인 시작...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  try {
    // GitHub OAuth 로그인 수행
    await loginWithGitHub(page, baseURL);

    // 로그인 성공 후 storageState 저장
    await context.storageState({ path: AUTH_FILE });
    console.log('✅ 인증 상태 저장 완료:', AUTH_FILE);
  } catch (error) {
    console.error('❌ 로그인 실패:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
