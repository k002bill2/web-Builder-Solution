# M2A-CLOSE-DEV — M2a 마감: Codex P2 6건 (Developer)

- 책임 Developer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 4337 · `--max-turns` 80 · `--effort` medium · **60턴부터 REPORT 마감 우선**
- 서브에이전트 금지(429 이력) · 시작 커밋 = main `b8a270b`(M2A-3c 병합 + 개정 4 적용 기록)
- 병렬 레인: **M2A-CLOSE-DESIGN**(Designer, 4339, `dev/active/m2a-close-design/`만 씀)이 같은 시각 main 화면을 시각 QA한다. 그 레인 경로·포트에 손대지 않는다. 오버레이 문제 문장 겹침은 **이 레인 범위 아님**(Designer 결정 → 후속 단계).
- 영환님 ★A(2026-10-04 — M2a 마감 레인 먼저, push는 그 뒤 승인 요청)
- **REPORT 규칙**: 시작 때 `dev/active/m2a-close-dev/REPORT.md` 골격(1 커밋 표 · 2 P2 6건 표(원인 · 수정 · 테스트 · 커밋) · 3 번들 표 · 4 SPEC 차이 · 5 Codex · 6 남은 위험 · 7 서버)을 커밋하고 **단계마다 같은 커밋에 채운다.**

## 근거
- 3b P2: `dev/active/m2a-3c/REPORT.md` 2.1절(P2-1~3) · 원문 `logs/c0-codex-3b.txt`
- 3c P2: 같은 REPORT 9절 7번(P2-a~c) · 원문 `logs/c5-codex.txt`
- `docs/design/m2a/SPEC.md` 3.3(PNG) · `docs/design/2a-05/SPEC.md` 5.13 · 8.3.2(잡 멱등) · r4.8~r4.12 · ADR-004 개정 2~4

## 범위 (한 건 = RED→GREEN → gate.sh exit 0 → 커밋 1개 · REPORT 2절 같은 커밋)
- **D1 P2-2 생성기 청크 실패 기억** — `memoryDocBook.ts` `browser ??=`가 rejected Promise를 기억 → 실패 시 `browser = undefined`, 슬롯 로더(`exportFlow.ts` `import("./staticHtml/staticHtml")`)를 기존 `retryableImport`로. RED = "첫 로드 실패 → 다시 시도 → 성공".
- **D2 P2-3 `blob:` 오탐** — `staticMarkup.ts:44` 검사 대상을 URL 속성(`src` · `href` · `srcset` · `poster` · `style`의 `url(`)으로 좁힌다. RED = 본문·대체텍스트에 글자 "blob:"이 있는 문서가 성공 · `src="blob:…"`는 여전히 실패.
- **D3 P2-1 이탈 후 죽은 내려받기 링크** — 기본안(Jarvis): **잡 결과 URL은 그 잡이 살아 있는 동안 유지**하고, 같은 문서의 **새 revision 잡이 결과를 내면 이전 URL을 해제**한다(편집기 이탈만으로는 해제하지 않음 · 문서당 살아 있는 URL ≤ 1). 8.3.2 멱등(같은 revision = 같은 잡)은 그대로. 이 안이 잡·멱등 규칙과 충돌하면 대안(해제된 결과 재생성) 실측 뒤 REPORT 4절에 사유. RED = "내보내기 → 편집기 이탈 → 돌아와 같은 revision 재요청 → 내려받기 링크가 살아 있음" + "새 revision 결과 → 이전 URL 해제 1회".
- **D4 P2-a PNG 준비 조건** — `StudioLayout.tsx:347-350` 준비 조건을 자동 저장 `idle` · `saved`로 좁힌다(`failed` · `offline` · `stale`은 "준비 전" + 이유 문장 — 문구는 기존 저장 상태 문장 재사용, 새 문구가 필요하면 REPORT 4절). RED = 세 상태 각각 `aria-disabled` + 이유.
- **D5 P2-b 토큰 없는 폴백 PNG** — `pngCapture.ts:82-84` PNG 경로만 `NO_KIT_TOKENS`를 무시하고 폴백 rects·직렬화를 기다린다. **정적 HTML 경로의 실패 정책은 그대로**(테스트로 고정). RED = 토큰 없음 → PNG 성공 · `fallback_count` = 섹션 수 · 파일 이름 `_구조포함`.
- **D6 P2-c 기본 글꼴 ≠ 16px** — `pngCapture.ts:78-79` `rem*16` 고정을 실제 rem px(`StructureCanvas`와 같은 방식)로 바꿔 iframe 폭 · SVG 폭 · 높이 측정 좌표계를 하나로. RED = 루트 글꼴 20px에서 390 프레임 → SVG 폭·높이 = iframe 실측.
- **D7 마감**: 전체 vitest는 Jarvis가 3회 돌린다(이 레인은 gate 표적·가드만). Codex `review --scope branch --base b8a270b` 1회(`logs/d7-codex.txt`, P1만 수정) · REPORT 마감 · 서버 0.

## 제외
- 오버레이 문제 문장 겹침(Designer 레인 → 후속) · 전역 심볼 슬롯 제거(M4) · 스냅샷 미리보기 캡처(E-S29) · Firefox 실측 · zip · 발행 · 새 기능.

## 번들
- `/studio/:projectId` 진입 ≤ **127.70**(지금 127.20 — 상향 금지, 개정 4 결정 3·4). 렌더 문서 JS ≤ 89.70 · CSS ≤ 30. 그 밖 화면·공통 ±0.03. 수정 코드는 가능한 한 조작 뒤 청크.

## 공통 규칙
- 판단 순서 ADR-003. SPEC과 다르게 한 곳은 REPORT 4절에 한 줄 사유.
- TDD RED→GREEN(RED 로그 `logs/d*-red.txt` 커밋). 단언 약화·skip 금지. **새 의존성·아이콘 0.** 엔진 계약 · `ExportJob` · `ExportGenerator` 타입 변경 0. `import type`.
- 보안: 숨은 iframe `sandbox="allow-scripts"` 그대로(`allow-same-origin` 금지) · 출처 검사 `event.source === iframe.contentWindow` 유지 · r4.12 고정 스크립트 바이트 불변.
- `design/` · `docs/design/` · `docs/decisions/` 수정 금지. fable 무접촉. `dev/active/m2a-close-design/` 무접촉. `git commit -- <경로>`. gate.sh exit 0 확인 후에만 커밋.
- 로컬 커밋만. **push · 병합 · 삭제 금지.** 서버는 4337만, 끝날 때 **자기가 띄운 서버 PID 전부 종료** + `lsof -nP -iTCP:4337 -sTCP:LISTEN` 결과 0을 REPORT 7절에.

## 수용 기준
1. P2 6건 각각 RED 로그 · GREEN 커밋 · REPORT 2절 행(또는 근거 있는 보류 1줄).
2. `/studio` 진입 ≤ 127.70 · 렌더 JS ≤ 89.70 · 그 밖 ±0.03.
3. Codex 1회 P1 0(또는 수정) · REPORT 자리표시 0 · 서버 0.
