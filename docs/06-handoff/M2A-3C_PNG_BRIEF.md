# M2A-3c — PNG 내려받기 + 3b 이관(Codex · 상호작용 판정 · 전역 슬롯 판단) (Developer)

- 책임 Developer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 4337(필요하면 4339) · `--max-turns` 110 · `--effort` medium · **80턴부터 REPORT 마감 우선**
- 서브에이전트 금지(429 이력) · 시작 커밋 = 기동 시점 main(**`m2a-3a-p2-fix` 병합 뒤** — Jarvis가 기동 때 SHA 기록)
- 선행: M2A-3b 병합 ✅(`3fb670a` — 정적 HTML 생성기 · 숨은 렌더 iframe `serialize` · `buildStaticHtml` · 내려받기) · 3a Codex P2 3건은 **영환님 Claude Code 세션이 `m2a-3a-p2-fix`에서 처리**(이 레인 범위 아님 — 손대지 않는다) · 영환님 ★A(2026-10-04)
- **REPORT 규칙**: 시작 때 `dev/active/m2a-3c/REPORT.md` 골격(1 커밋 표 · 2 C0 이관 · 3 C1 공간 실측 · 4 캡처 방식 PoC · 5 PNG 흐름 · 6 K-AC·E-AC 판정 · 7 번들 표 · 8 SPEC 차이 · 9 남은 위험·M2a 마감에 넘길 것)을 커밋하고 **단계마다 같은 커밋에 채운다.** 최근 레인 6개 중 5개가 턴 한도로 REPORT·브라우저 확인을 못 끝냈다 — 브라우저 단계 전에 REPORT를 먼저 갱신한다.

## 목적
편집기에서 **"PNG 내려받기"** 를 누르면 지금 미리보기 폭(1280·768·390)의 페이지 전체가 PNG 1장으로 저장된다. `requestExport` 밖(잡·스냅샷·멱등 0), 게이트·폴백과 무관하게 열림, 폴백 섹션은 "구조 미리보기" 표식과 함께 담김. 이로써 M2a 수직 슬라이스(실렌더 → 정적 HTML → PNG)가 끝난다.

## 근거
- `docs/design/m2a/SPEC.md` **3.3 PNG 버튼**(위치 · 문구 · 캡션 · 캡처 규칙 · 파일 이름 · 4상태 · 계측) · K-AC-17 · 19 · 32 · 34 · (3b 이관) K-AC-12 · 30
- `docs/design/2a-05/SPEC.md` 5.13 r4.8(PNG는 `requestExport` 밖) · E-AC-49 · 50 · S-B12 · 5.15
- `docs/decisions/ADR-004-performance-budgets.md` 개정 2·3(`/studio` 진입 127 · 멈춤선 126.70 · **추가 상향 금지**)
- `dev/active/m2a-3b/REPORT.md` 3절(방식 PoC — `react-dom/server` 기각) · 4절(serialize 프로토콜) · 5절(생성기 · 전역 슬롯) · **9절(넘길 것)**
- 코드: `app/src/features/studio/staticHtml/{staticHtml,staticMarkup,exportFileName}.ts` · `app/src/features/studio/{useExportFlow,exportFlow}.ts` · `app/src/components/studio/{StudioPanels,ExportAfter}.tsx` · `app/src/render/protocol.ts`

## 범위 (단계 = 체크포인트 · RED→GREEN · REPORT 같은 커밋)
- **C0 3b 이관 (코드 변경 없으면 REPORT만)**: (1) Codex `review --scope branch --base a51de92`(3b 전체 `a51de92..3fb670a`, `logs/c0-codex-3b.txt`) — P1은 고치고, P2 이하는 판정 — **전역 심볼 슬롯 등록(`Symbol.for("design-studio/static-html-generator")`)에 대한 판단을 반드시 포함**(유지 / 대체안 · 대체 비용 · 번들 영향). (2) 3b 결과 HTML 상호작용 [B]: K-AC-12(390 "메뉴" → 시트 열림 · Tab 다음 = "닫기" · Esc 닫힘 + 포커스 복귀 · 시트 안 앵커 → 닫힘 + 대상 섹션 · 제목이 header에 안 가려짐) · K-AC-30(Enter·버튼 → 이동·요청 0). 대상 = 앱에서 새로 내보낸 HTML(또는 `dev/active/m2a-3b/logs/j-export-sample_r2.html`).
- **C1 공간 실측 (선행 조건 — 구현 전)**: `/studio/:projectId` 진입 직후가 **126.70 = 멈춤선(여유 0)**. 3.3은 PNG 버튼·캡션·"준비 전" 상태가 **진입 때부터** 보이길 요구한다. 시제품으로 진입 증가량을 잰 뒤 SPEC을 바꾸지 않는 범위에서 공간을 만든다(우선순위: S-B5 "조작 뒤"로 분류된 진입 코드 이동 → 중복·미사용 정리 → 문구 상수 공유). **진입 ≤ 126.70 경로가 실측으로 안 보이면 C2 전에 멈추고 보고**(후보 안과 각 실측을 REPORT 3절에 — 예: PNG 묶음을 내보내기 묶음과 같은 조작 뒤 청크로 늦게 그리는 SPEC 개정, ADR-004 개정 — 모두 영환님 결정). 예산 상수·멈춤선 변경 금지.
- **C2 캡처 방식 PoC (새 의존성 0)**: 기본안(Jarvis 제안 — PoC로 확인·대체 가능): 3b의 숨은 렌더 iframe `serialize`를 **지금 문서 · 지금 미리보기 폭**으로 불러 마크업을 받고, 부모 조작 뒤 청크가 `buildStaticHtml` 계열로 HTML+CSS를 만든 뒤 **SVG `foreignObject` → `Image` → `canvas` → `toBlob("image/png")`** 로 그린다(외부 자원 0이라 캔버스 오염 없음이 전제 — Chrome·Safari(WebKit)·Firefox 각각 오염 여부를 확인하고 결과를 REPORT 4절 표로). 폴백 섹션은 표식 포함 그대로(3b의 "폴백 = 실패" 규칙은 HTML 생성기 전용 — PNG 경로는 폴백 허용으로 분리, 테스트로 고정). 캡처 규칙(3.3): 원래 폭(축소 비율 무시) · 전체 길이 · 오버레이 0 · sticky header 맨 위 · `details`·메뉴 시트 닫힘. 큰 페이지 상한(캔버스 최대 높이) 초과 시 실패 상태로.
  - 판정 기준: 결과 = 캔버스와 같은 모양 · 렌더 문서 JS 증가 0~소량(멈춤선 89.70, 지금 80.12) · `/studio` 진입 증가 0(C1 결과 안) · 새 의존성 0. 기본안이 막히면(오염 · 렌더 차이) 대안 1개 이상 실측 후 결정, 다 막히면 멈추고 보고.
- **C3 PNG 버튼 · 상태 · 파일 이름 (3.3 · K-AC-19 · 32 · 34)**: 위치(내보내기 묶음 다음 · 구분선 · 이름표 "이미지로 저장") · outline "PNG 내려받기" · 캡션 2문장 · 4상태(준비 전 `aria-disabled` + 이유 / 진행 `aria-busy` "PNG 만드는 중…" 두 번 누름 무시 / 성공 `role=status` / 실패 `role=alert` 같은 버튼 재시도) · `aria-describedby`는 내보내기 이유와 분리 · 파일 이름 `{이름}_{폭}_r{revision}(_구조포함).png`(3b `exportFileStem` 재사용) · 내려받기 = 부모 `<a download>` · object URL 해제 · 계측 `png_requested(view)`·`png_succeeded(view, fallback_count)`·`png_failed(reason)`(사용자 글자 0). `tEXt` 메타데이터는 하지 않는다(선택 항목 — REPORT에 판단만).
- **C4 판정 [U]·[B]**: K-AC-17(폴백 2개 문서 PNG 1280·390에 표식 2개 원래 크기) · K-AC-19 · 32 · 34 · E-AC-49·50(PNG 허용 · `requestExport` 0). [B]는 앱에서 실제로 내려받은 PNG를 열어 확인 — `shots/c4-png-{1280,390}.png`(PNG 자체를 shots에 복사) + 같은 순간 캔버스 캡처와 나란히.
- **C5** 전체 vitest 3회(exit 0 · Errors 0) · Codex `review --scope branch --base <시작 커밋>` 1회 · REPORT 마감 · 서버 종료.

## 제외
- 3a Codex P2 3건(영환님 세션) · zip(M4) · 이미지 업로드(A3-3) · 발행 · `tEXt` 메타데이터 · 스냅샷 미리보기 중 캡처(E-S29 — 스냅샷 미리보기 UI가 아직 없음, REPORT에 기록).

## 번들
- `/studio/:projectId` 진입 ≤ **126.70**(C1 선행 · 상향 금지). 캡처 코드 전부 조작 뒤 청크.
- 렌더 문서 JS 멈춤선 89.70 · CSS ≤ 30. 앱 코드를 렌더 문서로 옮기는 것 금지(ADR-004 개정 2 결정 3 · 가드 유지).
- 그 밖 화면·공통 ±0.03.

## 공통 규칙
- 판단 순서 ADR-003. SPEC과 다르게 한 곳은 REPORT 8절에 한 줄 사유.
- TDD RED→GREEN(RED 로그 커밋). 단언 약화·skip 금지. **새 의존성 0 · 새 아이콘 0.** 엔진 계약 · `ExportJob` · `ExportGenerator` 타입 변경 0. `import type`. `navigate(replace)` 금지.
- 보안: 숨은 iframe `sandbox="allow-scripts"` 그대로(`allow-same-origin` 금지) · 출처 검사 `event.source === iframe.contentWindow` · 결과 PNG에 편집기 UI 0.
- `design/`·`docs/design/`·`docs/decisions/` 수정 금지. fable 무접촉. **`m2a-3a-p2-fix` 브랜치·`/Users/younghwankang/Work/web-builder-solution-p2fix` 무접촉.** `git commit -- <경로>`. gate.sh exit 0 확인 후에만 커밋.
- 로컬 커밋만. **push·병합·삭제 금지.** 서버는 4337(필요하면 4339), 끝날 때 **자기가 띄운 서버 PID 전부 종료(vite dev·preview·python 정적 서버)** + `lsof -nP -iTCP:4337 -sTCP:LISTEN`·`:4339` 결과 0을 REPORT에. 캡처 도구가 시간 초과면 1장당 재시도 2회 → Chrome headless `--screenshot`(390은 390 폭 iframe 감싸기) 사용 가능.

## 수용 기준
1. C0: 3b Codex 판정(전역 슬롯 판단 포함) · K-AC-12·30 브라우저 판정.
2. C1: 진입 ≤ 126.70 경로 실측(또는 근거와 함께 정지).
3. PNG: 캡처 방식 브라우저별 결과 · 버튼 4상태 · 파일 이름 · `requestExport` 0 · K-AC-17·19·32·34 · E-AC-49·50 판정.
4. 실제 내려받은 PNG 1280·390이 캔버스와 같은 모양(나란히).
5. 전체 vitest 3회 exit 0 · REPORT 자리표시 0 · 서버 0.

## 확정
- m2a SPEC 3.3 · 2a-05 SPEC r4.8~r4.11 · ADR-004 개정 2·3 · 영환님 ★A(2026-10-04 — P2는 Claude Code 세션, 3c는 p2fix 병합 뒤 기동).
