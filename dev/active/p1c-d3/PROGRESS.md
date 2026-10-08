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
