# M2A-3a-fix — 처리되지 않은 오류 · Codex P2 4건 · 대체텍스트 판정(r4.11) · E6 결과 캡처 (Developer)

- 책임 Developer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 4337(127.0.0.1) · `--max-turns` 50 · `--effort` medium · **38턴부터 REPORT 마감 우선**
- 서브에이전트 금지(429 이력) · 같은 브랜치 `k002bill2/m2a-3a` · 시작 커밋 = 이 브리프 커밋
- 선행: M2A-3a E-pre~E7 커밋(`dad9f9b`) · Jarvis 검증(아래) · 영환님 ★A(2026-10-03) · 2a-05 SPEC **r4.11**(이 브랜치에 기록)
- **REPORT**: `dev/active/m2a-3a/REPORT.md`에 **10절 "fix"** 를 추가해 단계마다 같은 커밋에 채운다(1~9절은 지우지 않는다. 6·7·9절은 판정이 바뀐 곳만 갱신 표기).

## Jarvis 검증 결과 (고칠 근거)
- 전체 vitest x3: 1587/1587 통과지만 **exit 1 ×3 — Unhandled Rejection 3건**(main은 exit 0): `TypeError: Cannot read properties of undefined (reading 'primary')` at `src/engine/gate/contrastRow.ts:33` ← `runGate.ts:19·27` ← `src/features/studio/useGateReport.ts:32` (마지막 테스트 `SectionRemove.test.tsx` "<1024 '편집' 탭에서 삭제 → …").
- Codex(`logs/e7-codex.txt`) P2 4건 — 모두 실제 결함으로 판정:
  1. `components/studio/ExportAfter.tsx:26` — `open` 속성 때문에 `showModal()`이 안 돌아 비모달(배경 편집·포커스 이동 허용, Esc 0).
  2. `data/memoryDocBook.ts:163-165` — `phase:"response"` 실패 주입 시 스냅샷·queued 잡은 커밋됐는데 `runJob()` 미실행 → 같은 요청 재시도는 멱등 분기로 queued 잡만 반환 → 생성기 영구 미실행.
  3. `data/memoryDocBook.ts:94-99` — 실패 잡 재실행이 **현재 문서**를 생성기에 넘김(잡 `docRevision`·스냅샷은 N). 재실행은 잡을 만들 때의 스냅샷 문서로.
  4. `features/studio/useExportFlow.ts:76` — 결과 "다시 시도"가 `request()`를 바로 불러 재검사·경고 확인·저장 먼저를 건너뜀. 실패 요청의 revision이 지금 문서와 같으면 같은 잡 재시도, 다르면 일반 시작 흐름.
- E6: 이미지 없는 A안 문서가 "대체텍스트" 차단(Hero·About)으로 앱 안 조작으로는 내보낼 수 없음(REPORT 5.1 · 9절 4).

## 범위
- **F1 오류 3건 (RED 먼저)**: 원인 확인 — 테스트 픽스처 프로필이 `color_tokens` 없이 들어오는 경로인지, 앱에서도 생길 수 있는지(프로필 로드 전·조정만 있는 버전 등). **엔진 계약 변경 0**으로: 계산이 던지면 화면이 처리되지 않은 거부를 남기지 않는다(`useGateReport`가 실패를 상태로 받음). 색을 읽을 수 없는 프로필은 대비 줄 **차단 + 원인 문구**("테마 색을 읽을 수 없습니다" 계열 — `gateText` 기존 문구 체계, 바꾼 문구 REPORT)로. 엔진 쪽 `contrastRow`가 `color_tokens` 없음도 기존 `unreadable` 경로로 다루게 고치는 것은 허용(엔진 **계약**이 아닌 구현 방어 — REPORT에 근거). 판정: 전체 vitest가 **exit 0**(Errors 0).
- **F2 Codex P2 1 (모달)**: `open` 속성 제거 + `showModal()` · Esc = 취소(요청 0) · 닫히면 여는 버튼으로 포커스 복귀 · 열린 동안 배경 조작 불가. jsdom에 `showModal`이 없으면 기존 테스트 shim 방식 확인 후 테스트.
- **F3 Codex P2 2·3 (저장소 잡)**: 커밋 뒤 잡 실행을 응답 전달 성공과 분리 · 응답 실패 뒤 같은 요청 재시도 → 최종 `succeeded`(생성기 목 1회 실행) 테스트 · 실패 잡 재실행은 그 잡의 `auto·export` 스냅샷 문서로(테스트: N 실패 → N+1 저장 → N 재시도 → 생성기가 받은 문서 = N). 8.3.2 순서·한 트랜잭션 단언 유지.
- **F4 Codex P2 4 (다시 시도)**: 위 규칙 + 테스트(미저장 편집 뒤 다시 시도 → 저장 먼저 · 재검사 · 차단이면 요청 0).
- **F5 r4.11 대체텍스트 판정**: 2a-05 SPEC r4.11 행 — R-09 대상 = 실제 이미지 id가 들어간 이미지 슬롯만. 그라디언트(이미지 없음) 슬롯은 차단·경고 0. 엔진 게이트 규칙 수정(`slotRows` 등 — 규칙 구현이지 계약 변경 아님)·단위 테스트(이미지 없음 0건 · 이미지 있음 + alt 없음 = 차단 · 장식 표시 = 통과). 기존 단언 중 "이미지 없음 = 차단"을 보던 것은 **r4.11에 따라 바뀌는 단언**으로 REPORT 이관 표에 행별 근거(약화가 아니라 SPEC 개정 반영).
- **F6 E6 결과 캡처 재실행**: vite dev 4337, A안 → 폴백 2개 삭제 → 남은 차단이 있으면 앱 안 조작으로 해소(SEO 제목·설명 입력 등) → "정적 HTML 내보내기" → `GENERATOR_UNAVAILABLE` 결과 문구 `shots/f6-1280-result.png` · 경고 확인 대화상자(경고만 있는 상태가 만들어지면) `shots/f6-1280-dialog.png`. 그래도 게이트 통과가 불가능하면 남은 차단 줄 이름·원인을 REPORT에 적고 멈춘다(우회 픽스처 금지).
- **F7** 전체 vitest 3회(**exit 0 · Errors 0**, load 기록) · Codex `review --scope branch --base <이 브리프 커밋>` 1회 · REPORT 10절 마감 · 4337 서버 종료.

## 번들
- `/studio/:projectId` 진입 직후 **≤ 126.70(멈춤선, 지금 126.59 — 여유 0.11)**. 진입 직후 청크에 더할 코드는 F1의 오류 상태 처리 정도여야 한다. F2~F4는 조작 뒤 청크(`ExportAfter`·`exportFlow`) 안에서. 넘칠 것 같으면 진입 직후에서 조작 뒤로 옮길 수 있는 것(S-B5 분류)을 먼저 옮기고, 그래도 넘으면 멈춰 보고(127 이상 상향 금지 — ADR-004 개정 3).
- 그 밖 화면·공통 ±0.03(`/compare` 98.84 / 121.70) · 렌더 문서 변화 0.

## 공통 규칙
- TDD RED→GREEN(RED 로그 커밋). 단언 약화·skip 금지(r4.11로 바뀌는 단언만 이관 표로). 새 의존성·아이콘 0. 엔진 **계약**(타입·슬롯·섹션 정의) 변경 0. `import type`. `navigate(replace)` 금지.
- `design/`·`docs/design/`·`docs/decisions/` 수정 금지(r4.11은 Jarvis가 이미 기록). fable 무접촉. `git commit -- <경로>`. **gate.sh exit 0 확인 후에만 커밋.**
- 로컬 커밋만. push·병합·삭제 금지. **끝날 때 자기 서버 PID 종료(vite dev·preview) — `lsof -nP -iTCP:4337 -sTCP:LISTEN` 결과 0을 REPORT에.**

## 수용 기준
1. 전체 vitest x3 **exit 0 · Errors 0**.
2. Codex P2 4건 각각 RED→GREEN 테스트 · 새 Codex P1·P2 0(남으면 REPORT 판단).
3. r4.11: 이미지 없는 슬롯 차단 0 · 이미지 있는 슬롯 규칙 유지.
4. A안 브라우저에서 `GENERATOR_UNAVAILABLE` 결과 문구 캡처(또는 남은 차단 근거와 함께 정지).
5. `/studio` 진입 ≤ 126.70 · 다른 화면 ±0.03 · 4337 종료.
