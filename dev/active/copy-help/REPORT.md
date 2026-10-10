# COPY-HELP REPORT — 편집 패널 도움말 2건 (B-M2B-02 · B-M2B-03)

## 결과
- **B-M2B-02 닫힘** `bb58eaa` — `services/list`의 `items` 필드 아래 도움말 "가운뎃점(·)으로 나눕니다"(SPEC-BODY MQ-B1 원문). 기존 방식대로 `aria-describedby`로 입력에 연결.
- **B-M2B-03 닫힘** `98a8d2e` — `contact/booking` 편집 패널에 예약 문구 Callout(SPEC-BODY B1-11 원문: "내보낸 페이지에서 이 예약 양식은 … '온라인 예약은 준비 중입니다' …"). 제목도 "내보낸 페이지의 예약 양식".
- BACKLOG 두 행 닫힘 표기 `f0e99de`.

## 변경 파일
- `app/src/components/studio/FieldEditor.tsx` — 선택 prop `hint` 추가: 라벨 아래 `<p id="{id}-hint">`, `aria-describedby` 순서 = 캔버스 문제 id → hint → 카운터 → 안내.
- `app/src/components/studio/EditFields.tsx` — services/list `items`에만 `hint` 전달 · ContactOwnerNote 조건에 booking 추가(`booking` prop 전달).
- `app/src/components/studio/ContactOwnerNote.tsx` — `BOOKING_OWNER_NOTE` 상수 + `booking` prop으로 제목·문구 분기. lazy 청크 + DS Callout 주입 구조 그대로.
- 테스트: `EditFields.test.tsx`(신규 2건: 문구 + describedby 연결 / 다른 변형 무표시) · `ContactOwnerNote.test.tsx`(추가 2건: booking=예약·문의 없음 / form=문의·예약 없음).
- 문서: `docs/06-handoff/BACKLOG.md` 2행, `dev/active/copy-help/*`.
- 엔진·계약·lock·CLAUDE.md·design/ 변경 0 (`git diff --stat 6fc4668 -- app/package-lock.json app/src/engine CLAUDE.md design docs` → `docs/06-handoff/BACKLOG.md`만).

## TDD
- B-M2B-02 RED: 문구 없음으로 1 failed(예측 일치) → GREEN.
- B-M2B-03 RED: booking Callout 없음으로 1 failed(예측 일치), form 회귀는 pass → GREEN.

## 게이트 (fresh 실행, app/)
- `npm ci` exit 0 · lock 변경 0
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0
- `npx vitest --run` exit 0 — 297 files / 2654 tests passed

## Codex 검증
- `codex-companion review --scope branch --base 6fc4668` 1라운드 — 수정 필요 결함 0건. typecheck·`git diff --check` 통과. Codex 샌드박스에서는 Vite 임시 파일 생성 차단으로 테스트 미실행 → 위 로컬 전체 vitest가 근거.

## 번들 예산 실측 (build 출력)
| 지표 | 실측 | 상한 |
|---|---|---|
| `/studio` 진입 직후 자동 로드 포함 | 129.25KB | ≤129.65 |
| `/studio` 복원 진입 | 132.28KB | ≤132.68 |
| `/profile` 첫 화면 | 99.87KB | ≤100 |

## 생략·남은 것
- Ego Lite 실화면 확인 생략 — 바뀐 것이 문구와 `aria-describedby` 연결뿐이라 단위 테스트(DOM 문구·속성 단언)로 충분.
- 목업 차이: 도움말 위치(라벨 아래 caption)는 목업에 없음 — 기존 caption 토큰(`text-caption1 text-label-alternative`)으로 DS 일관성 우선.
- push/merge 안 함(브리프 범위 밖).
