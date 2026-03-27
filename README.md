# CommitMe Frontend

## 프로젝트 소개

**CommitMe**는 GitHub 레포지토리를 기반으로 AI가 이력서를 자동 생성하고, 모의 면접까지 연습할 수 있는 취업 준비 플랫폼입니다.

로그인부터 이력서 생성·수정, 면접 진행, 실시간 알림까지 사용자의 핵심 흐름을 390px 기준 모바일 웹 UI로 제공합니다.

### [Wiki 링크](https://github.com/100-hours-a-week/15-team-service-wiki/wiki)

## 시연 영상

클릭 시 유튜브로 이동합니다.

[![Video Label](https://github.com/user-attachments/assets/47de4c94-b541-4958-8b5d-1431b69dfdbc)](https://youtu.be/l2KNFv0aIR0)

## 기술 스택

| 분류          | 기술                          |
| ------------- | ----------------------------- |
| Framework     | React 18, Vite 6              |
| Routing       | React Router v7               |
| Server State  | TanStack Query                |
| Client State  | Zustand                       |
| HTTP          | Axios                         |
| Styling       | Tailwind CSS 4, MUI, Radix UI |
| Test          | Vitest, Testing Library       |
| Lint / Format | ESLint, Prettier              |

## 디렉터리 구조

```text
fe/
├─ src/app
│  ├─ api/             # API 클라이언트 및 endpoint 정의
│  ├─ components/      # 공통/기능/UI 컴포넌트
│  ├─ hooks/           # query, mutation, SSE, 웹소켓 훅
│  ├─ lib/             # queryClient, 유틸, 공통 설정
│  ├─ pages/           # 화면 단위 페이지
│  ├─ store/           # 클라이언트 상태 저장소
│  └─ types/           # 공통 타입/주석 기반 정의
├─ src/styles          # theme, global, typography
└─ package.json
```

## 개발 기여 내역

| 이름                                                                                                                                                   | 역할   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| [<img src="https://avatars.githubusercontent.com/u/96182623?v=4" height=130 width=130> <br/> @tl1l1l1s](https://github.com/tl1l1l1s) **신윤지(Theta)** | 풀스택 |
| [<img src="https://avatars.githubusercontent.com/u/145419432?v=4" height=130 width=130> <br/> @minzero0](https://github.com/minzero0) **안민영(Zero)** | 풀스택 |
