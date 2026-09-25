import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// 라우트가 React.lazy + Suspense라 첫 화면이 비동기로 나온다(React 19는 Suspense 내용 노출을 약 300ms 묶는다).
// 병렬 실행 부하에서 기본 1초 대기가 모자라 간헐 실패하므로 3초로 늘린다.
configure({ asyncUtilTimeout: 3000 });

afterEach(() => {
  cleanup();
});
