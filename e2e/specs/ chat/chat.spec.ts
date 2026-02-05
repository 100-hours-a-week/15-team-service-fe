import { test, expect } from '@playwright/test';
import { BasePage } from '../../pages/base.page';

test.describe('Chat Feature', () => {
    let basePage: BasePage;

    test.beforeEach(async ({ page }) => {
        basePage = new BasePage(page);
    });

    test('채팅방 목록 열기 및 확인', async ({ page }) => {
        // 1. 홈 페이지 이동
        await basePage.goto('/home');

        // 2. 채팅방 목록 버튼 확인 및 클릭
        const chatButton = page.getByRole('button', { name: '채팅방 목록 열기' });
        await expect(chatButton).toBeVisible();
        await chatButton.click();

        // 3. 채팅방 목록 타이틀 확인
        await expect(page.getByText('채팅방 목록')).toBeVisible();
    });

    test('채팅방 진입 및 메시지 전송 (방이 있는 경우)', async ({ page }) => {
        // 1. 홈 페이지 이동 및 채팅방 목록 열기
        await basePage.goto('/home');
        const chatButton = page.getByRole('button', { name: '채팅방 목록 열기' });
        await chatButton.click();
        await expect(page.getByText('채팅방 목록')).toBeVisible();

        // 2. 채팅방 목록 로딩 대기 (스켈레톤이나 로딩 상태가 있을 수 있음)
        // 리스트 컨테이너 대기
        const listContainer = page.locator('.space-y-3');
        try {
            await listContainer.waitFor({ state: 'visible', timeout: 5000 });
        } catch {
            console.log('채팅방 컨테이너가 발견되지 않았거나 비어있습니다.');
        }

        // 3. 채팅방 존재 여부 확인
        const chatRooms = listContainer.locator('button');
        const count = await chatRooms.count();

        if (count > 0) {
            console.log(`${count}개의 채팅방이 발견되었습니다. 첫 번째 방으로 진입합니다.`);

            // 첫 번째 채팅방 클릭
            await chatRooms.first().click();

            // 4. 메시지 입력창 확인
            const input = page.getByPlaceholder('메시지를 입력하세요...');
            await expect(input).toBeVisible();

            // 5. 메시지 입력 및 전송
            const testMessage = `Test Message ${Date.now()}`;
            await input.fill(testMessage);

            // 전송 버튼 찾기 (Send 아이콘이 있는 버튼)
            // lucide-react 아이콘 클래스 사용 또는 위치 기반 선택
            const sendButton = page.locator('button:has(svg.lucide-send)');
            await expect(sendButton).toBeEnabled(); // 입력 후 활성화 확인
            await sendButton.click();

            // 6. 전송된 메시지 확인 (화면에 나타나는지)
            // 메시지 리스트에 추가되었는지 확인
            await expect(page.getByText(testMessage)).toBeVisible();
        } else {
            console.log('채팅방이 없어 메시지 전송 테스트를 건너뜁니다.');
        }
    });
});
