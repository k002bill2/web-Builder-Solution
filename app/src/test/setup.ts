import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// 라우트가 React.lazy + Suspense라 첫 화면이 비동기로 나온다(React 19는 Suspense 내용 노출을 약 300ms 묶는다).
// 병렬 실행 부하에서 기본 1초 대기가 모자라 간헐 실패하므로 3초로 늘린다.
configure({ asyncUtilTimeout: 3000 });

afterEach(() => {
  cleanup();
});

// jsdom 30에는 HTMLDialogElement.showModal·close가 없다(EDITOR-A3-1 K5 실측) — 네이티브 `dialog` 대화상자(SPEC 5.15)를 그리기 위한 테스트 전용 대체.
// 모달의 바깥 비활성화(inert)는 흉내 내지 않는다 — 포커스·Esc(cancel 이벤트)·열림 상태만 본다.
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}
