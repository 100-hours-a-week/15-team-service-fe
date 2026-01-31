# State Management Guidelines

This document outlines the rules for state management to ensure consistency, performance, and maintainability.

---

### 1. State Management Decision Tree

Always choose the state management layer in the following order of priority.

**A. TanStack Query (Persistent Server State)**

-   **When to use:**
    -   Data originating from the backend, filesystem, or an external API.
    -   Data that requires caching, refetching, or tracking of loading/error states.
    -   Essentially, any data "not owned by the app" where an external source is the source of truth.
-   **Rule:** This state must be managed exclusively by TanStack Query. Do not sync it into Zustand stores.

**B. Zustand (Global UI State)**

-   **When to use:**
    -   Temporary, global UI state that is not persistent.
    -   Examples: Panel visibility, layout modes, command palettes, modals, global UI modes, navigation state.
-   **Rule:** Use a Zustand store for this type of state.

**C. useState (Local Component State)**

-   **When to use:**
    -   State that is local to a single component and its direct children.
    -   State tightly coupled to the component's lifecycle.
    *   Examples: Presentation state, toggles, dropdown visibility, temporary form inputs.
-   **Rule:** Use `useState` for local component state.

> **Note on Ambiguity:** If it's unclear which layer to use, first consider TanStack Query, then Zustand. Propose both options with their pros and cons before making an arbitrary choice.

---

### 2. Performance Rule: Zustand Subscription & Callbacks

To prevent unnecessary re-renders, follow these critical rules when using Zustand.

**[Forbidden]**

-   **Destructuring:** Do not destructure multiple values from the store hook in the component body. This subscribes the component to the entire store.
    -   `const { a, b } = useSomeStore(); // DON'T DO THIS`
-   **Callbacks with Store Dependencies:** Avoid creating callbacks that depend on store values in a dependency array, as this can cause the callback to be recreated frequently.

**[Required]**

1.  **Use Selectors for Minimal Subscriptions:**
    -   Always use a selector function to subscribe to the smallest piece of state needed.
    -   `const currentFile = useEditorStore(s => s.currentFile); // OK`
    -   `const hasCurrentFile = useEditorStore(s => !!s.currentFile); // OK`

2.  **Use `getState()` in Callbacks:**
    -   Inside event handlers or callbacks, use `useSomeStore.getState()` to read the latest state value without creating a subscription.
    -   This keeps callbacks stable (e.g., with an empty dependency array in `useCallback`).
    -   This is also necessary for asynchronous jobs where state might change during the operation.

---

### 3. UI Tree Maintenance Rule

-   **Goal:** Preserve the internal state of stateful UI components (e.g., components with scroll positions, form inputs).
-   **Rule:** For such components, avoid unmounting them with conditional rendering. Instead, keep them mounted and hide them using CSS (`display: none`, `visibility: hidden`, etc.).
    -   **Bad:** `{isVisible ? <StatefulPanel /> : null}`
    -   **Good:** `<StatefulPanel style={{ display: isVisible ? 'block' : 'none' }} />`

---

### 4. React Compiler Prerequisite

-   Do not overuse `useMemo`, `useCallback`, and `React.memo` for premature optimization.
-   The `getState()` pattern is an exception, as its primary purpose is to remove subscriptions, not for memoization.

---
### 5. Store Boundary & 신규 store 추가 규칙

- UIStore: 전역 UI 상태(패널/레이아웃/커맨드팔레트/모드/내비)
- Feature store: 도메인/기능 단위(예: document workflow 등), 임시 워크플로우 상태

신규 store 추가 시 체크리스트:
1) `src/store/`에 store 파일 생성
2) zustand `devtools` 미들웨어 패턴 적용(스토어 이름 포함)

---
### 6. 출력 요구사항 (AI가 항상 포함해야 할 것)
- 변경하는 상태마다 “왜 이 레이어인가?”를 1줄로 근거를 남기세요.
- 위 규칙을 위반하는 기존 코드가 보이면, 반드시 리팩토링 제안까지 포함하세요.
