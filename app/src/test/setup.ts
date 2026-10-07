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

// jsdom Blob은 Node structuredClone이 `{}`로 잃는다(PERSIST-P1b 실측) — 브라우저(IDB·structuredClone)는 Blob을 복제한다.
// Blob이 든 값만 Blob 자리를 표시로 바꿔 복제한 뒤 같은 Blob으로 되돌린다(Blob은 불변이라 같은 참조 = 복제와 같은 관찰). Blob 없는 값은 원래 함수 그대로.
const nativeClone = globalThis.structuredClone;
const BLOB_MARK = "__testBlob";
const swapBlobs = (value: unknown, blobs: Blob[], found: { any: boolean }): unknown => {
  if (value instanceof Blob) {
    found.any = true;
    return { [BLOB_MARK]: blobs.push(value) - 1 };
  }
  if (Array.isArray(value)) return Array.from({ length: value.length }, (_, i) => (i in value ? swapBlobs(value[i], blobs, found) : undefined));
  if (value instanceof Map) return new Map([...value].map(([k, v]) => [k, swapBlobs(v, blobs, found)]));
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype)
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, swapBlobs(v, blobs, found)]));
  return value;
};
const restoreBlobs = (value: unknown, blobs: readonly Blob[]): unknown => {
  if (Array.isArray(value)) return value.map((v) => restoreBlobs(v, blobs));
  if (value instanceof Map) return new Map([...value].map(([k, v]) => [k, restoreBlobs(v, blobs)]));
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const mark = (value as Record<string, unknown>)[BLOB_MARK];
    if (typeof mark === "number" && Object.keys(value).length === 1) return blobs[mark];
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, restoreBlobs(v, blobs)]));
  }
  return value;
};
globalThis.structuredClone = ((value: unknown, options?: StructuredSerializeOptions) => {
  const blobs: Blob[] = [];
  const found = { any: false };
  const swapped = swapBlobs(value, blobs, found);
  return found.any ? restoreBlobs(nativeClone(swapped, options), blobs) : nativeClone(value, options);
}) as typeof structuredClone;
