/**
 * 봉투 수제 확인 (ADR-007 개정 1 — 진입 검증은 schemaVersion만, zod는 조작 뒤) · 6절 "앱보다 높은 버전 = 읽기 전용"
 */
import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION, STORE_NAMES, checkEnvelope } from "./envelope";

describe("checkEnvelope (진입 몫)", () => {
  it("버전·kind·id 일치 → ok + data", () => {
    expect(checkEnvelope({ schemaVersion: SCHEMA_VERSION, kind: "doc", id: "project-1", data: { a: 1 } }, "doc", "project-1")).toEqual({ status: "ok", data: { a: 1 } });
  });

  it("레코드 없음 → missing", () => {
    expect(checkEnvelope(undefined, "doc", "project-1")).toEqual({ status: "missing" });
  });

  it("버전 불일치 → mismatch + found · 앱보다 높으면 newer(읽기 전용 안내) · 낮으면 이행 대상", () => {
    expect(checkEnvelope({ schemaVersion: SCHEMA_VERSION + 1, kind: "doc", id: "p", data: {} }, "doc", "p")).toEqual({ status: "mismatch", found: SCHEMA_VERSION + 1, newer: true });
    expect(checkEnvelope({ schemaVersion: 0, kind: "doc", id: "p", data: {} }, "doc", "p")).toEqual({ status: "mismatch", found: 0, newer: false });
    expect(checkEnvelope({ schemaVersion: "1", kind: "doc", id: "p", data: {} }, "doc", "p")).toEqual({ status: "mismatch", found: "1", newer: false });
  });

  it("봉투 모양이 아님(객체 아님·kind/id 다름·data 없음) → invalid", () => {
    expect(checkEnvelope("문자열", "doc", "p")).toEqual({ status: "invalid" });
    expect(checkEnvelope(null, "doc", "p")).toEqual({ status: "invalid" });
    expect(checkEnvelope({ schemaVersion: SCHEMA_VERSION, kind: "job", id: "p", data: {} }, "doc", "p")).toEqual({ status: "invalid" });
    expect(checkEnvelope({ schemaVersion: SCHEMA_VERSION, kind: "doc", id: "q", data: {} }, "doc", "p")).toEqual({ status: "invalid" });
    expect(checkEnvelope({ schemaVersion: SCHEMA_VERSION, kind: "doc", id: "p" }, "doc", "p")).toEqual({ status: "invalid" });
  });

  it("저장소 이름 = ADR-007 3절 (a) 데이터 모델", () => {
    expect([...STORE_NAMES]).toEqual(["meta", "studio", "docs", "snapshots", "images", "board", "saved"]);
  });
});
