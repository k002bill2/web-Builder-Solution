/**
 * 편집기 계측 호출 지점 (DS-2A-05 9절) — 수집기 전에는 `window` 이벤트 `studio:editor` 하나(2a-04a2 `studio:profile` 선례, 새 의존성 0).
 * 넣는 값은 코드·개수·열거값뿐 — 프로젝트 이름·슬롯 글자·파일 이름은 넣지 않는다.
 */
export const EDITOR_EVENT = "studio:editor";

export type EditorEvent =
  | { readonly name: "gate_checked"; readonly block_count: number; readonly warn_count: number }
  | { readonly name: "export_requested"; readonly format: "react-zip" | "static-html" }
  | { readonly name: "export_succeeded"; readonly format: "react-zip" | "static-html" }
  | { readonly name: "export_failed"; readonly reason: string }
  | { readonly name: "snapshot_created"; readonly kind: "auto"; readonly reason: "export" };

export function emitEditorEvent(event: EditorEvent): void {
  window.dispatchEvent(new CustomEvent<EditorEvent>(EDITOR_EVENT, { detail: event }));
}
