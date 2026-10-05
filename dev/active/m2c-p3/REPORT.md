# M2C-P3 REPORT — M2c P3 결함 묶음 (B-M2C-06·07·04·05·02)

- worktree `m2c-p3` · 브랜치 `k002bill2/m2c-p3` · base `7125138` · push/merge/삭제 0 · 서브에이전트 0
- 수정 금지 경로(docs/**·BACKLOG·CLAUDE.md·package*.json/lock·기준선 파일·한도) 변경 0. B-M2C-08(지운 뒤 대체텍스트) 동작 변경 0.

## 1. 항목별 전후

| 항목 | 전 | 후 | 파일 |
|---|---|---|---|
| B-M2C-06 | "이미지 지우기"(Enter·마우스) 뒤 버튼이 사라져 포커스 BODY | 지우기 핸들러가 같은 슬롯 버튼 줄의 첫 버튼("이미지 고르기" — 같은 DOM 노드, 글자만 바뀜)으로 포커스 이동 후 문서 반영 | `ImageSlotField.tsx` |
| B-M2C-07 | 지운 뒤 `role=status`가 "이미지를 넣었습니다…" 그대로 | "이미지를 지웠습니다" | `ImageSlotField.tsx` |
| B-M2C-04 | 폭 변경(배치 3단↔2단↔탭) 때 EditFields가 재마운트되어 "이미지 편집" 펼침 닫힘 | 펼침 상태를 StudioLayout이 든다(`imagesOpen` 선택 prop, 없으면 EditFields 지역 상태 — 기존 테스트 불변). `<details open={open}>` 제어 | `StudioLayout.tsx`·`EditFields.tsx` |
| B-M2C-05 | "끄면 이미지 없이 색 면으로 보이고 …" | "끄면 이미지 자리 없이 섹션 배경만 보이고 대체텍스트 검사에서 빠집니다" (SPEC r2 4절) | `ImageSlotField.tsx` |
| B-M2C-02 | /studio 조작 뒤 목록에 이미지 패널·변환기 없음 | `STUDIO_AFTER_ACTION`에 `ImageSlotPanel.tsx`·`images/ingest/index.ts` 2키 추가(보고용) | `scripts/check-bundle-size.mjs` |

### 사유·주의 (목업/SPEC과 다르게 한 점 포함)
- 07 문구: SPEC 2.5 상태표에 "지움" 행이 없다(grep `지웠` docs/design·design 0건). 기존 앱 톤("대표색을 지웠습니다"·"폰트를 지웠습니다")과 2.5의 "이미지를 넣었습니다"에 맞춘 최소 문구. 대체텍스트 안내는 붙이지 않음(B-M2C-08 결정 대기 — 암묵 결정 회피).
- 05: SPEC 2.2 "유지" 목록에는 r0 문구("끄면 색 면/자체 그래픽")가 남아 있고 4절 r2 정정이 최신 — BRIEF대로 4절을 따름. SPEC 2.2 정정은 Designer 레인 몫. `engine/contracts/pageDoc.ts:53` 주석에도 "색 면" 표현이 남아 있으나 엔진 계약 파일이라 손대지 않음(동작 무관 주석).
- 02: `imageStore`·`exportImages`는 이름에 해시가 붙은 공유 청크(`_imageStore-*.js`·`_exportImages-*.js`)라 manifest에 소스 키가 없다 — 키로 넣을 수 없고 `checkBundle` 로직 변경은 범위 밖. 실측 집계 위치: `ImageSlotPanel.tsx` 줄 +4.31KB **2개 파일 = 패널 + imageStore**, `exportFlow.ts` 줄 +3.26KB 3개 파일(정적 import에 `_exportImages` → `_imageStore` 포함). ingest +2.65KB 1개 파일.
- 04 부작용(의도 범위): ① 이미지 슬롯 없는 섹션으로 갔다 돌아와도 펼침이 열린 채(기존에도 같은 EditFields 안에서는 유지되던 동작) ② 폭을 바꾸면 패널 자체는 다시 마운트되므로 변환 진행 중 작업은 버려지고(기존 언마운트 규칙 — Codex r1 P1) 패널 `role=status` 글이 비워진다. 고른 이미지·문서는 StudioLayout이 들고 있어 유지(Ego Lite 390에서 미리보기 그대로 확인). 탭 배치의 선택 탭(섹션/편집/검사)은 기존대로 StudioLayout 상태 — 이번 변경 없음.

## 2. 테스트 (항목별 RED 전 예측 커밋 → RED → GREEN)

| 항목 | 예측 | RED | GREEN | 누계 |
|---|---|---|---|---|
| 06 | +2 (`ImageSlotPanel.test` Enter 지우기·잃은 이미지 마우스 지우기 → 포커스 "이미지 고르기") | 2 실패(activeElement = BODY) | 통과 | 2036 |
| 07 | +1 (status = "이미지를 지웠습니다") | 1 실패(빈 값/이전 문구) | 통과 | 2037 |
| 04 | +1 (`StudioLayoutImages.test` 펼친 채 1280→1024→768→390→1280, change 알리는 matchMedia 흉내) | 1 실패("1024: expected false to be true") | 통과 | 2038 |
| 05 | +1 (문구 = SPEC r2 · 스위치 aria-describedby 연결 · "색 면" 0) | 1 실패(문구 없음) | 통과 | 2039 |
| 02 | +2 (`bundleBudget.test` 소스 키 확인 = RED 대상 · 키 추가 전후 failures·합계 줄 동일 = 판정 불변 가드, 변경 전에도 통과) | 1 실패(키 없음) | 통과 | 2041 |

- 전체 vitest: `cd app && npx vitest run` → **Test Files 227 passed · Tests 2041 passed · exit 0** (기준선 2034 + 7 = 예측과 일치). 기존 테스트 단언 수정·skip 0.
- typecheck `npm run typecheck` exit 0 · lint `npm run lint` exit 0 · build `npm run build` exit 0 (`logs/build-final.log`).

## 3. 번들 (`logs/bundle-diff-vs-base.txt` = base build 대비 diff)
- `/studio/:projectId` 진입 직후 127.04 → **127.07** (멈춤 > 127.39 · 한도 128) · 첫 화면 91.77 → 91.76.
- 다른 라우트 변화 ±0.01 이내(해시 문자열 gzip 흔들림) · 렌더 JS 84.19 / CSS 8.80 **불변**.
- 판정 줄·failures 불변. 늘어난 출력은 "조작 뒤" 2줄뿐(ImageSlotPanel +4.31 · ingest +2.65).

## 4. Ego Lite 실화면 (영환님 지시)
- 서버: `npx vite --host 127.0.0.1 --port 4337 --strictPort` (PID 91340, cwd = 이 worktree `app`). main 5480(PID 82062)은 리슨 확인만, 무접촉.
- 시작 전 `listTaskSpaces()` = `[]`. space 78 "m2c-p3 dev" / p1. 첫 `goto("/catalog")` 1회 뒤 앱 안 클릭만(새로고침 0): 헤어살롱·모던 카페 비교 추가 → 비교 보드 "B 모던 카페 전부 선택" → 프로필 확정 v1 → 3안 만들기 → A안 선택 → 편집 시작 → `/studio/project-1`. 폭은 CDP `Emulation.setDeviceMetricsOverride`, 끝에 clear.
- 테스트 이미지: node zlib로 만든 320×200 그라디언트 PNG `/tmp/m2cp3-test.png`(외부 이미지 0, 커밋 0).
- 실측(1280):
  - OPEN: 도움말 "끄면 이미지 자리 없이 섹션 배경만 보이고 대체텍스트 검사에서 빠집니다" (`shots/05-w1280-switch-caption.png`)
  - PICKED: status "이미지를 넣었습니다 대체텍스트를 적어 주세요"
  - 키보드 Enter로 지우기 → status "이미지를 지웠습니다" · focus = BUTTON "이미지 고르기" (`shots/06-07-w1280-after-clear-enter.png` — 포커스 링 보임)
  - 마우스로 지우기 → 같은 결과
- 폭 변경(이미지 넣은 채 펼침): 1280 → 1024 → 768 → 390 → 1280 모두 `details open=true` · 스위치 있음 (`shots/04-w1024|768|390-panel-open.png`, `04-w1280-panel-open-back.png`). 768에서 탭 배치 첫 진입 시 선택 탭이 "섹션"이라 "편집" 탭을 눌러 화면에 띄웠다(탭 선택은 이번 범위 밖 기존 동작). 390에서 미리보기·"320 × 200 · WebP 1KB" 유지.
- 종료: `finish({keep:[]})` → `{"spaceId":78,"closedSpace":true,"keptManagedLabels":[],"closedManagedLabels":["p1"],"preservedUnmanagedCount":0}` · **`listTaskSpaces()` = `[]`** · 4337 kill → 리슨 0 확인.

## 5. Codex
- r1 `node codex-companion.mjs review --scope branch --base 7125138` (1.0.6) — **실제 완료, 지적 0** ("수정이 필요한 결함을 발견하지 못했습니다"). Codex 자체 실행: typecheck·`git diff --check` 통과, vitest는 Codex 샌드박스 임시 디렉터리 차단으로 미실행(위 2절 전체 vitest가 대신 증거). 로그 `logs/codex-r1.log`. 라운드 1/2 — 지적 0이라 r2 생략.

## 6. meta
- 커밋: P0 BRIEF·PROGRESS → 항목마다 예측 커밋 → fix 커밋(06·07·04·05·02) → 증거 커밋 → REPORT.
- 한계: Ego Lite(Chromium) 1종 실측. Safari·Firefox·실기기·스크린리더 낭독 미검증.
