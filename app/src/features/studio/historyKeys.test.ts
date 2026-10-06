import { historyKey } from "./historyKeys";

/** ER-AC-U1 · U2 (EDITOR-REST SPEC r1 3.5) — 단축키 판정: 입력칸 밖 Ctrl/⌘+Z · Shift+Ctrl/⌘+Z · Ctrl+Y, 미리보기 중 무시 */
const body = () => document.body;
const inside = (html: string) => {
  document.body.innerHTML = html;
  return document.querySelector<HTMLElement>("[data-t]")!;
};

describe("historyKey", () => {
  it("Ctrl/⌘+Z = undo · Shift+Ctrl/⌘+Z · Ctrl+Y = redo · 한글 자판(code KeyZ) 인식 · 수식 키 없음·Alt = 무시", () => {
    expect(historyKey({ key: "z", code: "KeyZ", ctrlKey: true, target: body() }, false)).toBe("undo");
    expect(historyKey({ key: "z", code: "KeyZ", metaKey: true, target: body() }, false)).toBe("undo");
    expect(historyKey({ key: "Z", code: "KeyZ", ctrlKey: true, shiftKey: true, target: body() }, false)).toBe("redo");
    expect(historyKey({ key: "Z", code: "KeyZ", metaKey: true, shiftKey: true, target: body() }, false)).toBe("redo");
    expect(historyKey({ key: "y", code: "KeyY", ctrlKey: true, target: body() }, false)).toBe("redo");
    expect(historyKey({ key: "ㅋ", code: "KeyZ", ctrlKey: true, target: body() }, false)).toBe("undo");
    expect(historyKey({ key: "z", code: "KeyZ", target: body() }, false)).toBeUndefined();
    expect(historyKey({ key: "z", code: "KeyZ", ctrlKey: true, altKey: true, target: body() }, false)).toBeUndefined();
    expect(historyKey({ key: "x", code: "KeyX", ctrlKey: true, target: body() }, false)).toBeUndefined();
  });

  it("글자 입력칸(text input·textarea·select·contenteditable)·열린 dialog 안·IME 조합 중·미리보기 중 = 무시 · 라디오·체크박스·버튼은 단축키 대상", () => {
    const z = (target: EventTarget, locked = false, isComposing = false) => historyKey({ key: "z", code: "KeyZ", ctrlKey: true, isComposing, target }, locked);
    expect(z(inside('<input data-t type="text">'))).toBeUndefined();
    expect(z(inside("<input data-t>"))).toBeUndefined();
    expect(z(inside("<textarea data-t></textarea>"))).toBeUndefined();
    expect(z(inside("<select data-t></select>"))).toBeUndefined();
    expect(z(inside('<div contenteditable="true"><span data-t>a</span></div>'))).toBeUndefined();
    expect(z(inside("<dialog open><button data-t>x</button></dialog>"))).toBeUndefined();
    expect(z(body(), false, true)).toBeUndefined();
    expect(z(body(), true)).toBeUndefined();
    expect(z(inside('<input data-t type="radio">'))).toBe("undo");
    expect(z(inside('<input data-t type="checkbox">'))).toBe("undo");
    expect(z(inside("<button data-t>x</button>"))).toBe("undo");
  });
});
