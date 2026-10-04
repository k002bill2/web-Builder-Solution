# M2A-CLOSE2 — 오버레이 문제 목록 · 빈 필수 칸 표시 (SPEC r4.13) (Developer)

- 책임 Developer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 4337 · `--max-turns` 70 · `--effort` medium · **55턴부터 REPORT 마감 우선**
- 서브에이전트 금지 · 시작 커밋 = 기동 시점 main(Jarvis가 기록)
- 근거: `docs/design/2a-05/SPEC.md` **r4.13 행(정본)** · 5.7 · r4.8~r4.12 · `dev/active/m2a-close-design/REPORT.md` 2~4·6절(시안 `mock-overlay-options.html` · `shots/v3-*` · 번들 추정 `logs/v3-bundle*`) · ADR-004 개정 4
- 영환님 "1-★A, 2-★A"(2026-10-04)
- **REPORT 규칙**: 시작 때 `dev/active/m2a-close2/REPORT.md` 골격(1 커밋 표 · 2 단계별 판정 · 3 번들 표 · 4 SPEC 차이 · 5 테스트 이관 표 · 6 브라우저 캡처 · 7 Codex · 8 남은 위험 · 9 서버)을 커밋하고 단계마다 같은 커밋에 채운다.

## 범위 (단계마다 RED→GREEN → gate.sh exit 0 → 커밋)
- **O0 번들 선행 실측**: 최소 시제품(O1 목록 + 배지 번호)으로 `/studio` 진입을 먼저 잰다. 지금 127.24 · 멈춤선 127.70. **넘으면 멈추고 보고**(Designer 추정 +0.18 상한 · 대안 = 문장 `sr-only`(B안) 실측 함께). 예산 상수 변경 금지.
- **O1 문제 목록**(r4.13 (1)): `StructureCanvas.tsx` — 캡션 다음 · `<div ref={area}>` 앞에 `<ol data-canvas-issues>`(문제 0이면 없음). 문장 `<p id>`를 목록으로 옮김 · 오버레이 issues.map에서 문장 제거. 목록은 사각형 전에도 렌더(E-AC-49).
- **O2 배지 번호 · 위치**(r4.13 (2)): 배지 글자 = `{경고|차단} {N}`(목록 순번) · `aria-hidden` · 위 슬롯을 덮지 않는 위치(Q6) — 1280·390 캡처로 확인.
- **O3 빈 필수 칸**(r4.13 (3)): `canvasIssues.ts`에 빈 필수 글자 슬롯 → `block` 문제(섹션 사각형 기준 테두리·배지). 문장은 기존 필드·게이트 빈 필수 문장 재사용(새 문구가 꼭 필요하면 REPORT 4절). 게이트 R-13 판정 불변. 필드 `aria-describedby` 맨 앞 = 문장 id 규칙 유지.
- **O4 게이트 요약 · 진입 요약 문구**(r4.13 (4)(5)): 행 대표 문장 = 차단 항목 우선 · "바뀐 점 N개".
- **O5 판정 [B]**: 127.0.0.1:4337에서 Designer 재현 조작(Hero 제목 30자 · 부제 96자 · Services 카드 1 제목 29자 · Hero 버튼 문구 비움) → 1280 · 390 캡처(`shots/o5-*`) — 렌더 글자 위 문장 0 · 배지 번호 구분 · 빈 버튼 칸 섹션 표시. 문제 목록 ↔ 필드 포커스(배지 클릭) 동작.
- **O6 마감**: 전체 vitest는 Jarvis가 3회. Codex `review --scope branch --base <시작 커밋>` 1회(`logs/o6-codex.txt`, P1만 수정) · REPORT 마감 · 서버 0.

## 테스트 이관 (Designer 4절 grep)
- `StructureCanvas.test.tsx` 57~62행("사각형 전에는 … `queryByText("경고 1")` null") → 배지 `[data-issue-badge]` 기준으로 같은 의도 이관 · 155~157행(`sentence.parentElement` = 테두리 감싸개) → 배지 `parentElement`로. 그 밖 r4.13으로 바뀌는 단언만 REPORT 5절 이관 표(행별 근거). 단언 약화·skip 금지.

## 공통 규칙
- 번들: `/studio` 진입 ≤ **127.70**(상향 금지) · 렌더 JS ≤ 89.70 · 그 밖 ±0.03. 렌더 문서 코드 변경 0 예상(부모 오버레이 작업).
- 새 의존성·아이콘 0. 엔진 계약 · `ExportJob` · `ExportGenerator` 타입 변경 0. `allow-same-origin` 금지. r4.12 고정 스크립트 바이트 불변.
- `design/` · `docs/design/` · `docs/decisions/` 수정 금지. fable 무접촉. `git commit -- <경로>`. gate.sh exit 0 확인 후에만 커밋.
- 로컬 커밋만. **push · 병합 · 삭제 금지.** 서버는 4337만, 끝날 때 자기가 띄운 서버 PID 전부 종료 + `lsof -nP -iTCP:4337 -sTCP:LISTEN` 결과 0을 REPORT 9절에. 캡처 도구 시간 초과면 1장당 재시도 2회 → Chrome headless `--screenshot`(390은 iframe 감싸기).

## 수용 기준
1. O0 번들 실측(또는 근거와 함께 정지). 2. 1280·390에서 렌더 글자 위 문제 문장 0 · 배지 번호 구분 · 빈 필수 칸 섹션 표시(캡처). 3. E-AC-49 · `aria-describedby` 유지 테스트. 4. Codex P1 0 · REPORT 자리표시 0 · 서버 0.
