import { test, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

test.describe('Settings Feature', () => {
    let basePage: BasePage;

    test.beforeEach(async ({ page }) => {
        basePage = new BasePage(page);
        await basePage.goto('/settings');
    });

    test('설정 페이지 기본 렌더링 확인', async ({ page }) => {
        // 1. 헤더 확인
        await expect(page.getByRole('heading', { name: '설정' })).toBeVisible();

        // 2. 프로필 섹션 확인
        await expect(page.getByText('프로필', { exact: true })).toBeVisible();

        // 3. 프로필 정보 표시 확인 (이름, 포지션, 전화번호 라벨)
        await expect(page.getByText('이름', { exact: true })).toBeVisible();
        await expect(page.getByText('희망 포지션', { exact: true })).toBeVisible();
        await expect(page.getByText('전화번호', { exact: true })).toBeVisible();

        // 4. 하단 버튼 확인
        await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
        await expect(page.getByRole('button', { name: '회원탈퇴' })).toBeVisible();
    });

    test('프로필 수정 모드 진입 및 취소', async ({ page }) => {
        // 1. 수정 버튼 클릭
        const editButton = page.getByRole('button', { name: '수정' });
        await expect(editButton).toBeVisible();
        await editButton.click();

        // 2. 입력 필드 확인
        // 이름 입력 필드 (접근성 연결이 안되어 있어 name 속성 사용)
        const nameInput = page.locator('input[name="name"]');
        await expect(nameInput).toBeVisible();

        // 포지션 셀렉트
        await expect(page.getByRole('combobox')).toBeVisible();

        // 전화번호 입력 필드
        const phoneInput = page.getByPlaceholder('010-1234-5678');
        await expect(phoneInput).toBeVisible();

        // 3. 저장/취소 버튼 확인
        const saveButton = page.getByRole('button', { name: '저장' });
        const cancelButton = page.getByRole('button', { name: '취소' });
        await expect(saveButton).toBeVisible();
        await expect(cancelButton).toBeVisible();

        // 4. 취소 버튼 클릭 및 원상복구 확인
        await cancelButton.click();
        await expect(editButton).toBeVisible();
        await expect(saveButton).toBeHidden();
    });

    test('로그아웃 다이얼로그 확인', async ({ page }) => {
        // 1. 로그아웃 버튼 클릭
        const logoutButton = page.getByRole('button', { name: '로그아웃' });
        await logoutButton.click();

        // 2. 다이얼로그 확인
        const dialog = page.getByRole('alertdialog'); // ConfirmDialog usually uses role alertdialog
        await expect(dialog).toBeVisible();
        await expect(dialog.getByText('정말 로그아웃하시겠습니까?')).toBeVisible();

        // 3. 취소 클릭
        await dialog.getByRole('button', { name: '취소' }).click();
        await expect(dialog).toBeHidden();
    });

    test('회원탈퇴 다이얼로그 확인', async ({ page }) => {
        // 1. 회원탈퇴 버튼 클릭
        const withdrawButton = page.getByRole('button', { name: '회원탈퇴' });
        await withdrawButton.click();

        // 2. 다이얼로그 확인
        const dialog = page.getByRole('alertdialog');
        await expect(dialog).toBeVisible();
        await expect(dialog.getByText('정말 탈퇴하시겠습니까?')).toBeVisible();

        // 3. 취소 클릭
        await dialog.getByRole('button', { name: '취소' }).click();
        await expect(dialog).toBeHidden();
    });
});