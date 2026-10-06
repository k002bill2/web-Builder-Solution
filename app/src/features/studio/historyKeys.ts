/** 단축키 판정 입력 — KeyboardEvent의 필요한 필드만(테스트는 객체로 넘긴다) */
type KeyInput = Partial<Pick<KeyboardEvent, "key" | "code" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey" | "isComposing">> & { readonly target: EventTarget | null };

/** 글자 입력칸 · 열린 대화상자 — 브라우저 기본 실행 취소에 맡긴다(가로채지 않음) */
const TEXT = "textarea,select,[contenteditable]:not([contenteditable=false]),dialog[open]";
/** 글자를 받지 않는 input — 변형 교체 뒤 포커스가 라디오에 남는다(6.4) */
const NOT_TEXT = new Set(["radio", "checkbox", "button", "submit", "reset", "range", "color", "file"]);

/**
 * 편집 틀 단축키(EDITOR-REST SPEC r1 3.5 · ER-AC-U1·U2) — 입력칸 밖 Ctrl/⌘+Z = 실행 취소 · Shift+Ctrl/⌘+Z · Ctrl+Y = 다시 실행.
 * 미리보기 중·IME 조합 중이면 무시. 한글 자판은 key가 "ㅋ"라 code도 본다.
 */
export function historyKey(e: KeyInput, locked: boolean): "undo" | "redo" | undefined {
  if (locked || e.isComposing || e.altKey || !(e.ctrlKey || e.metaKey)) return undefined;
  const key = e.key?.toLowerCase();
  const y = e.code === "KeyY" || key === "y";
  if (!y && e.code !== "KeyZ" && key !== "z") return undefined;
  const t = e.target instanceof Element ? e.target : null;
  if (t?.closest(TEXT) || (t instanceof HTMLInputElement && !NOT_TEXT.has(t.type))) return undefined;
  return y || e.shiftKey ? "redo" : "undo";
}
