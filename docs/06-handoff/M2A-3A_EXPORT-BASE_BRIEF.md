# M2A-3a — 내보내기 기반: `/studio` 공간 확보 · 게이트 8줄 표시 · `requestExport`(8.3.2 전체) · "내보내기 전" 스냅샷 · 버튼 사전 차단 (Developer)

- 책임 Developer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 4337(127.0.0.1) · `--max-turns` 120 · `--effort` medium · **90턴부터 REPORT 우선**
- 서브에이전트 분할: 불필요 — 429 이력으로 이 프로젝트는 금지 유지
- 대상 저장소 `/Users/younghwankang/Work/web-builder-solution`(레인 worktree) · 시작 커밋 = 이 브리프가 들어 있는 main
- 선행: M2A-2b 병합 ✅(`8f5768d`, VS-1 실렌더 7변형) · 영환님 ★A(2026-10-03): M2A-3을 3a(내보내기 기반) → 3b(정적 HTML) → 3c(PNG)로 순차
- **REPORT 규칙(이번부터)**: 시작할 때 `dev/active/m2a-3a/REPORT.md` 골격(아래 절 제목)을 먼저 만들고, **단계를 끝낼 때마다 그 단계 절을 채워 같은 커밋에 넣는다.** 지난 두 레인은 턴 한도로 REPORT 없이 끝났다.

## 목적
편집기의 "품질 게이트 · 내보내기" 자리(지금 제목만 — `components/studio/StudioPanels.tsx:92` `GatePanel`)를 SPEC대로 동작하게 만든다. 이 레인이 끝나면 게이트 8줄이 보이고, 내보내기 버튼이 게이트 차단·렌더러 없는 섹션에서 이유와 함께 막히며, 누르면 저장소가 8.3.2 순서로 판정한다. **실제 파일 생성기(정적 HTML·zip)는 아직 없다** — 이 레인에서 `static-html`·`react-zip` 둘 다 `GENERATOR_UNAVAILABLE`로 끝나는 것이 정상이며, 생성기 자리는 3b가 꽂을 수 있게 주입식으로 둔다.

## 근거 (먼저 읽기 — 절·행 번호로 인용)
- `docs/design/2a-05/SPEC.md`: **5.12 게이트 표**(8줄 순서·차단·경고·이동 대상) · **5.13 내보내기**(r4.8 렌더러 없는 섹션 사전 차단 포함) · 5.11 표 "내보내기 전" 행 · **8.3 `requestExport` 행 · 8.3.2 판정 순서(r4.8: 1 모양 → 2 멱등 → 3 NOT_FOUND → 4 STALE_DOC → 5 GATE_FAILED → 6 GENERATOR_UNAVAILABLE(형식별) → 7 UNRENDERED_SECTIONS → 8 쓰기)** · E-S22~E-S27 · 9절 계측(`gate_checked`·`export_*`·`snapshot_created`) · 10.2 S-B4·S-B5 · E-AC-25·26·27·28·29·30·43·44·48·50 · r4.8·r4.9·r4.10
- `docs/design/m2a/SPEC.md` **3.2 A·B**(차단 문구 최종안 · 게이트 차단과 함께일 때 순서 · `aria-describedby` 순서) · K-AC-18
- `docs/decisions/ADR-004-performance-budgets.md`(개정 1·2) · `dev/active/m2a-2b/REPORT.md` 6절·10절(번들 여유 0)
- 코드: `app/src/engine/gate/{runGate,gateText,docRows,slotRows,requiredSections,contrastRow,issue}.ts` · `app/src/data/{projectRepository,memoryProjectRepository,memoryDocBook}.ts` · `app/src/components/studio/{StudioPanels,StudioLayout,StudioToolbar}.tsx` · `app/src/features/studio/{docEngine,useDocSave,canvasCaption}.ts` · 렌더러 있는 변형 목록 `RENDERED_VARIANTS`(M2A-2b B6) · `app/scripts/check-bundle-size.mjs` SCENARIOS

## 범위 (단계 = 체크포인트 · RED→GREEN 커밋 · PROGRESS·REPORT 갱신)
- **E0 기준선 · 공간 확보 (선행 조건)**: `/studio/:projectId` 진입 직후가 **124.70(멈춤선)** 이다. 먼저 이 레인이 부모에 더할 코드(게이트 목록 표시 · 버튼·이유 · 결과 Callout · 경고 대화상자 연결)의 크기를 **실측 시제품**으로 잰다. 그다음 SPEC을 바꾸지 않는 범위에서 공간을 만든다. 우선순위:
  1. **SPEC S-B5가 이미 "조작 뒤"로 분류한 것**은 조작 뒤 청크로: 경고 확인 대화상자(E-S24) · 잡 조회 · 결과 처리(E-S27 문구 포함) · `requestExport` 호출 경로.
  2. 진입 직후에 꼭 보여야 하는 것(S-B4: 게이트 목록 **표시**)만 남기고, 계산(`runGate`)은 이미 진입 직후 엔진 청크(S-B4) 쪽에 둔다.
  3. 기존 진입 직후 코드에서 중복·사용 안 하는 코드 정리(근거와 전후 실측).
  - **E0 종료 조건**: 계획된 추가분을 넣고도 진입 직후 ≤ 124.70이 될 경로가 실측으로 보이면 진행. **보이지 않으면 E1 이전에 멈추고 보고**(선택지: 1024 미만 "검사" 탭처럼 1280에서도 게이트 목록을 접힌 상태로 시작하는 SPEC 개정 등 — 영환님 결정 사항). 예산 상수·멈춤선은 바꾸지 않는다.
- **E1 게이트 8줄 표시 (5.12 · E-S22~E-S25 · E-AC-25·27·28)**: `GatePanel`에 순서 고정 8줄 · 줄마다 상태 단어(Q14) · 차단·경고 개수 Tag · 성능 예산 "측정 전"(버튼 아님) · 편집 직후 `aria-busy` + "편집 전 기준" 캡션 → 재계산 뒤 해제 · 오래된 결과로 내보내기 요청 0. 픽스처로 표의 차단·경고 조건마다 1건 이상 재현(E-AC-25).
- **E2 줄 → 이동 (E-AC-26 · E-S26)**: 문제 줄 → 해당 섹션 선택 + 필드 포커스(<1024는 "편집" 탭으로) · 툴바 "검사 · 내보내기" → h2 "품질 게이트" 포커스 / <1024 "검사" 탭 + 요약 알림 1회.
- **E3 저장소 `requestExport` (8.3 · 8.3.2 · E-AC-43·44·48)**: 메모리 구현에서 `missing` 대신 8.3.2 판정 순서 전체를 구현한다.
  - **생성기 주입**: 형식별 생성기 등록 자리(예: `generators: Partial<Record<ExportFormat, …>>`, 이름은 Developer 확정). **이 레인의 기본값 = 둘 다 없음**(→ 6단계 `GENERATOR_UNAVAILABLE`). 3b가 `static-html`을 등록한다.
  - 7단계 `UNRENDERED_SECTIONS`: 판정 = `RENDERED_VARIANTS`에 `type/variant`가 없는 섹션. 개수 + `instanceId` 목록(문서 순서).
  - 8단계 쓰기: `auto·export` 스냅샷 + 잡 + 멱등 기록을 **한 트랜잭션**(commit 실패 → 변화 0). 스냅샷은 이 경로에서만 만든다(화면은 만들지 않는다 — E-AC-30). 같은 (projectId·format·revision) 재요청 = 같은 잡, 스냅샷 +0. `JOB_TIMEOUT`·`INFRA` 재시도 = 같은 잡 재실행.
  - 테스트: 판정 순서 단위 테스트(E-AC-44 · E-AC-48의 순서 문장) · 생성기 가능 목 저장소로 E-AC-43 전체 · 게이트 차단 + 폴백 → `GATE_FAILED` · `react-zip` + 폴백 → `GENERATOR_UNAVAILABLE`.
  - 수동 스냅샷 UI·복원(E-AC-31)은 **범위 밖**. `createSnapshot`(수동)은 계속 `missing`이어도 된다 — 내부 "내보내기 전" 스냅샷 작성 함수만 만든다.
- **E4 버튼 사전 차단 · 이유 목록 (5.13 · m2a 3.2 A · E-AC-29·50 · K-AC-18)**: 두 버튼 "React 프로젝트(zip) 내보내기" · "정적 HTML 내보내기"(outline, 아이콘 없음).
  - 게이트 차단 → `aria-disabled` + 이유 "차단 {n}건({첫 줄 이름}: {원인}) — 고치면 열립니다" + "첫 차단으로 이동".
  - 렌더러 없는 섹션 ≥ 1 → m2a 3.2 A 문장(개수 · 이름 목록 ≤ 3 + "외 k개") + "첫 구조 미리보기 섹션으로 이동".
  - 둘 다 → 이유 `ul` 순서 게이트 → 구조 미리보기, 버튼 `aria-describedby` 같은 순서.
  - 경고만(폴백 0) → 누르면 확인 대화상자(E-S24, 조작 뒤 청크) · 취소 = 요청 0.
- **E5 내보내기 시작 · 결과 (5.13 시작 문장 · E-S27 · E-AC-30)**: 결과 오래됨 → 재계산 먼저 · 저장 전 변경 → 저장 먼저(실패·`STALE_DOC`면 요청 0) · `requestExport` 1회 · 버튼 `aria-busy` "내보내는 중…" · 결과 문구: `GENERATOR_UNAVAILABLE` = 기존 E-S27 informative 문구를 **형식별**로(예: zip은 "M4", 정적 HTML은 "다음 단계" — 문구는 SPEC 문장 기반, 바꾼 곳은 REPORT) · `UNRENDERED_SECTIONS` = m2a 3.2 B · 재시도 가능 실패 = alert + 다시 시도(같은 잡). 계측 9절(`gate_checked`·`export_requested/failed`·`snapshot_created` — 사용자 글자 0).
- **E6 브라우저 확인**: vite dev 127.0.0.1:4337, 앱 흐름 A안(portfolio·testimonials 폴백 2개) → 1280 창: 게이트 8줄 · 버튼 차단 + 구조 미리보기 이유 · "첫 구조 미리보기 섹션으로 이동" 누름 → 선택. 폴백 2개를 지운 문서(본문 5개, D-2 실측 경로)에서 → 차단 이유가 사라지고 누르면 `GENERATOR_UNAVAILABLE` 결과 문구. 390 창 "검사" 탭. **캡처는 iframe 밖 부모 화면이라 일반 뷰포트 캡처로 충분**(필요 시 iframe은 scrollIntoView). `shots/e6-*.png`.
- **E7** 전체 vitest 3회 · Codex `review --scope branch --base <시작 커밋>` 1회(턴 남을 때) · REPORT 마감.

## 제외
- 정적 HTML 생성·내려받기(3b) · PNG(3c) · zip(M4) · 수동 스냅샷·복원 UI(E-AC-31) · 실행 취소 단축키(E-AC-32) · 테마 바꾸기·이미지(A3-3) · 오버레이 문제 문장 겹침(Designer 대기).

## 번들
- `/studio/:projectId` 첫 ≤ 99.40 · **진입 ≤ 124.70(지금 124.70 — E0가 선행)**. 그 밖 화면·공통 ±0.03.
- 렌더 문서 JS 멈춤선 89.70(지금 79.89) — 이 레인은 렌더 문서를 거의 건드리지 않아야 한다.
- 조작 뒤 청크는 SCENARIOS `STUDIO_AFTER_ACTION`에 등록해 크기를 출력한다(판정 밖). 분류 규칙은 `check-bundle-size.mjs` 머리 주석.

## 공통 규칙
- 판단 순서 ADR-003. SPEC과 다르게 한 곳은 REPORT에 한 줄 사유. 브리프와 SPEC이 다르면 SPEC이 이긴다(단 E0 멈춤 조건은 지킨다).
- TDD RED→GREEN(RED 로그 커밋). 단언 약화·skip 금지. **새 의존성 0 · 새 아이콘 0(S-B7).** 엔진 계약 변경 0(게이트 규칙은 엔진 그대로 사용). 화면에서 engine 값 import 금지 — 엔진은 기존 조작 청크·진입 직후 엔진 청크 경로로만. `import type`. 상태 지우기 `navigate(replace)` 금지.
- `design/`·`docs/design/`·`docs/decisions/` 수정 금지. fable 무접촉. 커밋은 `git commit -- <경로>`. **typecheck 실패 상태로 커밋 금지**(지난 레인 1건 — gate.sh exit 0 확인 후 커밋).
- 체크포인트 게이트(매 코드 커밋): 표적 test + `npx vitest run src/test` + typecheck + lint + build. `dev/active/m2a-2b/gate.sh`를 복사해 써도 된다.
- 로컬 커밋만. push·병합·삭제 금지. 서버는 127.0.0.1:4337, **끝날 때 자기가 띄운 서버 PID 종료**(지난 세 레인이 서버를 남겼다).
- REPORT 절: 1 커밋 표 · 2 E0 공간 확보(전후 실측·옮긴 코드) · 3 게이트 표시 · 4 `requestExport` 판정 순서·생성기 주입 모양 · 5 버튼·이유·결과 문구(바꾼 문구) · 6 E-AC·K-AC 판정(번호별) · 7 번들 표(체크포인트별) · 8 SPEC 차이 · 9 남은 위험(3b에 넘길 것).

## 수용 기준
1. E0 공간 확보 실측 표 — 또는 멈춤 보고.
2. 게이트 8줄 · 이동 · 재검사(E-AC-25~28) · 버튼 사전 차단(E-AC-29·50 · K-AC-18) 판정.
3. `requestExport` 판정 순서 8단계 단위 테스트 · E-AC-43·44·48 PASS · 화면이 스냅샷을 만들지 않음(E-AC-30).
4. A안 브라우저 캡처(차단 이유 → 폴백 제거 → `GENERATOR_UNAVAILABLE` 결과).
5. 진입 ≤ 124.70 · 전체 vitest 3회 통과 · REPORT 자리표시 0 · 4337 서버 종료.

## 확정
- 2a-05 SPEC r4.8~r4.10 · m2a SPEC 3.2 · 영환님 ★A(2026-10-03, M2A-3 3분할).
