/**
 * 결정 A 대조 가드 (dev/active/m2b-5/DECISION-A.md) — 비교 프레임 다리의 `readRenderMessage`·모양 검사 로컬 사본이 `render/protocol.ts` 원본과 같다.
 * ① 소스 텍스트 동일: 선언 줄 묶음(첫 줄 + 들여쓴 이어지는 줄 + 닫는 `}`)을 공백 1칸으로 정규화해 비교한다 — 원본이 바뀌면 여기서 실패한다.
 * ② 같은 메시지 코퍼스(정상·다른 창·다른 프레임·모양 틀림·출처 틀림)에서 원본(캔버스 다리와 같은 판정)과 사본 결과가 같다.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readRenderMessage } from "../../render/protocol";
import { frameMessage, readRenderMessage as copiedReadRenderMessage } from "./compareFrame";

const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

/** 최상위 선언 하나 — `const NAME`/`function NAME`(export 허용) 줄부터 들여쓴 줄이 끝날 때까지(닫는 `}` 포함), 공백 정규화 */
function declaration(text: string, name: string): string {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => new RegExp(`^(export )?(const|function) ${name}\\b`).test(line));
  if (start < 0) throw new Error(`${name} 선언이 없습니다`);
  const body = [lines[start]!];
  for (const line of lines.slice(start + 1)) {
    if (line === "}") {
      body.push(line);
      break;
    }
    if (!/^\s+\S/.test(line)) break;
    body.push(line);
  }
  return body.join(" ").replace(/\s+/g, " ").trim();
}

const COPIED = ["isObject", "isText", "isNumber", "isRect", "readRenderMessage"] as const;

describe("readRenderMessage 로컬 사본 대조 (결정 A)", () => {
  it("소스 텍스트 동일 — isObject·isText·isNumber·isRect·readRenderMessage", () => {
    const original = source("../../render/protocol.ts");
    const copy = source("./compareFrame.ts");
    for (const name of COPIED) expect(declaration(copy, name), name).toBe(declaration(original, name));
  });

  it("메시지 코퍼스 동작 동일 — 정상·다른 창·다른 프레임·모양 틀림·출처 틀림", () => {
    const mine = document.createElement("iframe");
    const other = document.createElement("iframe");
    document.body.append(mine, other);
    const rect = ["hero-1", null, 0, 0, 1280, 640];
    const corpus: unknown[] = [
      { type: "ready" },
      { type: "rects", rects: [rect, ["hero-1", "title", 0, 0, 10, 10]] },
      { type: "rects", rects: [] },
      { type: "click", instanceId: "hero-1" },
      { type: "error", code: "INVALID_DOC" },
      { type: "error", code: "NO_KIT_TOKENS" },
      { type: "rects", rects: [["x", null, 0, 0, "w", 1]] },
      { type: "rects", rects: Array.from({ length: 1025 }, () => rect) },
      { type: "rects", rects: "nope" },
      { type: "click", instanceId: "" },
      { type: "click", instanceId: "x".repeat(65) },
      { type: "error", code: "OTHER" },
      { type: "html", markup: "<p>" },
      { type: "rects", rects: [[...rect.slice(0, 5)]] },
      { type: "rects", rects: [["", null, 0, 0, 1, 1]] },
      { type: "rects", rects: [["a", 3, 0, 0, 1, 1]] },
      { type: "rects", rects: [["a", null, 0, 0, Number.NaN, 1]] },
      null,
      undefined,
      "ready",
      ["ready"],
      { type: "unknown" },
    ];
    for (const data of corpus) expect(copiedReadRenderMessage(data), JSON.stringify(data)?.slice(0, 80)).toEqual(readRenderMessage(data));
    // 캔버스 다리(StructureCanvas useRenderFrame)와 같은 판정: 그 프레임의 contentWindow가 아니면 버림 → 모양 검사. 출처(origin)는 불투명이라 보지 않는다
    const canvas = (event: MessageEvent, frame: HTMLIFrameElement | null) =>
      !frame || event.source !== frame.contentWindow ? undefined : readRenderMessage(event.data);
    const sources: (MessageEventSource | null)[] = [mine.contentWindow, other.contentWindow, window, null];
    for (const data of corpus)
      for (const from of sources)
        for (const origin of ["null", "https://evil.example", ""])
          for (const frame of [mine, null]) {
            const event = new MessageEvent("message", { data, source: from, origin });
            expect(frameMessage(event, frame)).toEqual(canvas(event, frame));
          }
    mine.remove();
    other.remove();
  });
});
