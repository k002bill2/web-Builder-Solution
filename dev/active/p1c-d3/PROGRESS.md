# P1C-D3 PROGRESS

- [x] BRIEF P0 커밋
- [x] SPEC 2절·1.2·1.7·1.8·3·4·6절 읽기, 기존 코드(ProjectsPage·persistence 읽기 인터페이스) 파악
- [x] 1번: 영역(상태 문장·사용량 순수 함수·persist 버튼) + W1 문구 교체 — TDD 예측·RED·GREEN, 커밋
- [x] 2번: 강등 판정 표시(1.7·1.8) — TDD, 커밋 (영역 컴포넌트가 storageCheck에 의존해 1번과 한 커밋)
- [x] 번들 관문(/projects ≤125 · /studio 129.62 · 복원 132.65±0.03) — 96.03/100 · 103.38/125 · /studio 129.61(−0.01) · 복원 132.65
- [x] Ego Lite 캡처 ≤3장 + 정리
- [x] typecheck·lint·build·전체 vitest exit 0
- [x] REPORT

## 설계 (advisor 검토 반영)
- 배치: 영역을 `/projects` 페이지 청크에 **정적**으로 둔다(첫 화면 94.04/100 · 진입 101.39/125 여유). 지연 청크는 `check-bundle-size.mjs` auto 목록 수정이 필요해(이 레인 쓰기 범위 밖) 택하지 않음 — 정적이면 측정이 자동으로 정직.
- `data/persistence/*`·`deferredStudio`·`memoryProjectRepository` 값 import 0(공유 청크 재분할로 /studio 129.62·복원 132.65 흔들림 방지). DB 이름 리터럴, 같음은 테스트에서 `ENTRY_DB_NAME`로 단언.
- 파일: `features/projects/storageUsage.ts`(사용량 순수 함수) · `features/projects/storageCheck.ts`(강등 재확인·문장) · `components/projects/BrowserStorageSection.tsx`(영역) · `pages/ProjectsPage.tsx`(W1·배치) + 각 테스트.
- 강등 재확인은 `persistence !== "local"`일 때만, 연결은 읽고 바로 close(+onversionchange close) — D2 버전 올리기·D4 deleteDatabase를 막지 않게.

## RED 예측
- storageUsage.test: 모듈 없음 → import 실패로 전부 FAIL.
- storageCheck.test: 모듈 없음 → 전부 FAIL.
- BrowserStorageSection.test: 모듈 없음 → 전부 FAIL.
- ProjectsPage.test: W1 새 문구 단언(memory·local) FAIL, 영역 h2 "이 브라우저 저장소" 단언 FAIL. 나머지 기존 테스트는 PASS 유지.

## RED 실측 (예측 일치)
- storageUsage·storageCheck·BrowserStorageSection.test: 모듈 없음 → 파일 3개 FAIL.
- ProjectsPage.test: W1 memory·local 단언, 영역 h2 단언 3건 FAIL · 기존 38건 PASS. ("불러오는 동안 영역 없음"은 RED에서도 PASS — 부재 단언이라 예상대로)

## GREEN
- 대상 8파일 87건 통과 · typecheck·eslint 무출력.
- ProjectsPage.test "60자 이름" 쿼리: 영역 h2가 생겨 `{ level: 2 }`가 2개 → `{ level: 2, name: long }`으로 대상 지정(단언 동일, 약화 아님).
- 기준선 build(53769ec): /projects 94.04 · 101.39, /studio 129.62, 복원 132.65.

## Ego Lite 중 발견 → 수정 (TDD)
- 거절 결과가 sr-only status에만 있어 화면에 안 보임(SPEC 2절 "결과 문장 갱신" 위반) → 테스트를 "보이는 문장 = 거절 문장 · 축출 문장 사라짐 · 버튼 유지"로 바꿔 RED 2건 확인 → `kept: "refused"` 상태로 GREEN(28).

## Codex r1 수정 (P2 1건 — 문서 봉투로 인한 강등 미판정)
- [x] RED 예측 기록 → 테스트 → RED 실측
- [x] storageCheck: state v1일 때 docs 봉투 전체 스캔(newer 우선 > invalid) — GREEN
- [x] typecheck·lint·build(/projects ≤125 · /studio ≤129.65 · 복원 ≤132.68)·전체 vitest 1회
- [x] REPORT "Codex r1 수정" 절 · 커밋

### 선택: docs 저장소 봉투 전체 스캔 (진입 몫 0)
- "가장 최근 진입 문서" 안은 /projects가 진입 projectId를 알아야 해 진입 경로(deferredStudio 등)에 기록이 필요 → 진입 바이트 ≠0. 전체 스캔은 /projects 페이지 청크에만 들어간다.
- 스캔 조건: state 레코드가 있고 v1일 때만(state missing이면 readEntry는 문서와 무관하게 `{}`=local). docs 저장소 없으면 ok.
- 규칙: entryRead `checkEntryEnvelope`와 같음(kind "doc" · id === key · data 있음 · v1 ok · 숫자>1 newer · 그 외 invalid). getAllKeys+getAll 같은 트랜잭션.

### RED 예측
- storageCheck.test 새 케이스: state v1 + doc v99 → newer / 깨진 doc · id≠key · v0 → invalid / newer+invalid 혼재 → newer — 현재 `ok` 반환이라 전부 FAIL. "전부 정상 → ok"와 parity 테스트는 PASS 예상(현 구현도 ok/규칙 동일).
- BrowserStorageSection.test Codex 재현(memory · state v1 · doc v99): 현재 ok 문장이 떠 1.8 문장 heading 못 찾음 → FAIL.
- 기존 케이스 전부 PASS 유지.

### RED 실측
- 5건 FAIL(storageCheck 4 · Section Codex 재현 1), 기존 19건 PASS. **예측과 차이 1건**: parity 테스트도 FAIL — 현 구현이 문서를 보지 않아 v2 문서에 `ok`를 돌려줌(예측은 "규칙 동일이라 PASS"였으나 입력이 docs라 판정 자체가 없음).

### GREEN · 관문
- 대상 2파일 24건 통과 · typecheck·lint exit 0.
- build exit 0: /projects 96.17 / 103.53(≤125) · /studio 129.63(≤129.65) · 복원 132.66(≤132.68).
- 전체 vitest 1회 exit 0 — 267 파일 / 2338 테스트.
