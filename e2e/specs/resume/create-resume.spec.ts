import { test, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

test.describe('Resume Generation Tests', () => {
    let basePage: BasePage;

    test.beforeEach(async ({ page }) => {
        basePage = new BasePage(page);
    });

    test('이력서 생성 페이지 진입 및 이력서 생성', async ({ page }) => {
        // 홈페이지에서 이력서 탭으로 이동
        await basePage.goto('/home');
        await basePage.clickBottomNav('생성');

        // 레포지토리 선택
        await page.getByRole('button', { name: '3-jun-bae-community-fe' }).click();
        await page.getByRole('button', { name: 'tf1-ktb-BootcampChat-LoadTest' }).click();
        await page.getByRole('button', { name: /\d+\s*개 레포로 계속/ }).click();
        await basePage.expectPath('/create-resume');

        // 카테고리 선택 후 이력서 생성
        await page.getByRole('button', { name: 'AI', exact: true }).click();
        await page.getByRole('button', { name: 'AI로 이력서 생성' }).click();
        await page.getByRole('button', { name: '생성하기' }).click();
        await basePage.waitForLoadingComplete();
        await expect(page).toHaveURL(new RegExp(`resume/\\d+$`));
    });

});