# EDITOR-A2-SHELL — REPORT (S1 병합 · RESUME-1 S2~S7 완료)

**결론**: S1(D1~D3)은 GREEN·전 게이트 통과로 커밋했다(`270bf6c`). 같은 커밋의 빌드에서 `/profile` 진입 직후가 **124.72KB(여유 0.28 < 0.3)** 라 브리프 중지 규칙이 발동했다 → S2~S6 미착수.

## 1. 커밋
| SHA | 내용 |
|---|---|
| `5cbf320` | S0 base build 실측 · PROGRESS 수신 |
| `270bf6c` | S1 문서 분기 · 편집 알림 1회 · 진입 h1 포커스 |

## 2. 파일 (app/src/)
- 수정: `pages/StudioPage.tsx`(문서 분기 — 문서 없음 E-S03 유지)
- 새: `features/studio/useStudioDoc.ts`(`useStudioDoc` 조회 · `useEntryState` 이동 state 1회 읽기 + `history.replaceState`로 `usr`만 비움) · `features/studio/selection.ts`(이름·변형 이름표·첫 선택·문서 Tag) · `components/studio/{StudioLayout,StudioToolbar,SectionList}.tsx` · `pages/StudioPage.test.tsx`
- F 레인 파일·`AppLayout.tsx`·`CandidateCard.tsx`·engine·design 무접촉.

## 3. AC 판정
| 항목 | 판정 | 근거 |
|---|---|---|
| D1 문서 있음 → E-S03 아님(편집 틀) | PASS | `StudioPage.test` "문서 있음 → …" |
| E-AC-02 문서 없음 → E-S03 그대로 | PASS | 같은 파일 + `StudioEmptyStates.test` |
| D2 editNotice `role=status` "편집 알림" 1개·1회·재렌더 1회·다시 열기 0회 · `display:none` 아님 | PASS | 테스트 3건. `navigate(replace)` 미사용 — 위치 key 불변 단언 |
| D3 편집 시작 도착 → 포커스 = h1(`tabIndex=-1`) | PASS | 테스트 2건(알림 있음 · 바뀐 쌍 0개) |
| 3회 반복 | PASS | `logs/s1-repeat.txt` 7/7 × 3 |
| S2 E-AC-03 · S3 E-AC-04·13 · S4 E-AC-05 · S5 E-AC-14 · S6 E-AC-15·16 | **미착수** | 중지 규칙(4절) |

S1 틀에 이미 들어간 것(판정 대상 아님, S2~S4에서 테스트 예정): `header` 툴바 · "프로젝트로 돌아가기" → `/projects` · 섹션 줄 `aria-current`.

## 4. 번들 (gzip KB, `check-bundle-size.mjs`)
| 화면 | base `932d423` | S1 `270bf6c` | 변형: registry 미사용 | 멈춤선 |
|---|---|---|---|---|
| 공통 JS | 89.34 | 89.36 | 89.34 | 변화 0 원칙 |
| /catalog 첫 | 99.65 | 99.67 | 99.65 | 99.70 |
| /references/:id 첫 | 96.99 | 97.01 | — | 99.70 |
| /compare 진입 | 121.39 | 121.41 | — | 124.70 |
| **/profile 첫 / 진입** | 99.60 / 124.69 | 99.63 / **124.72** | 99.61 / **124.71** | 99.70 / 124.70 |
| /projects 진입 | 106.99 | 107.03 | 107.00 | 124.70 |
| /studio 첫 / 진입 | 90.73 / 104.33 | 95.49 / 108.47 | 91.77 / 105.37 | 99.70 / 124.70 |

실측 원인(L1, 로그 `logs/s1-build-try1-icon-tag.txt` · `s1-build-try2-css-chevron.txt` · `s1-variant-no-registry.txt` · `s1-build.txt`):
- studio 청크에서 `components/ds/Icon` import → 공통 청크 재분할 **+0.39**(`/catalog` 100.18·`/profile` 125.30 예산 초과) → 제거.
- `chevron-left.svg?url` 직접 import → 공통 **+0.08** → 제거(CSS chevron으로 대체).
- `ds/Tag`(+`cx`) → 작지만 0 아님 → 토큰 span으로 대체.
- 남은 공통 +0.02 = index 프리로드 목록에 `registry` 청크 이름 추가(registry 미사용 변형은 89.34로 복귀).
- `/profile` +0.02~0.03은 registry를 빼도 남는다 → 원인 미상(L3: 다른 청크의 해시 문자열 변화에 따른 gzip 요동으로 추정, profile 청크 모듈 변경 없음).
- 교훈: base 여유 0.31은 studio 변경이 만드는 요동(±0.02~0.03) 안에 있다. **S2~S6은 `/profile` 여유 확보 없이는 어떤 변경으로도 규칙에 걸릴 가능성이 높다.**
- CSS(판정 밖): index.css gzip 9.07 → 9.14 kB(새 유틸리티 클래스). Q-24 경로 아님(engine 문자열 아님).

## 5. 검증 명령 · 결과
- `npx vitest run src/pages/StudioPage.test.tsx` RED 6 fail/1 pass(`logs/s1-red.txt`) → GREEN 7/7(`s1-green.txt`), 3회 반복 `s1-repeat.txt`.
- 가드: `npx vitest run src/test src/engine/engineImportGuard.test.ts src/components/studio` → 7 files · 64 passed(`s1-guards.txt`).
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0(`s1-build.txt`, 예산 검사 통과 — 멈춤선만 위반).
- 전체 `npx vitest run` → 112 files · **1279 passed · 실패 0**(`logs/full-vitest.txt`).
- 서버 미기동. `lsof -nP -iTCP:4337 -sTCP:LISTEN` → 빈 출력.
- Codex: **이관**(중지로 S1에서 멈춤 — 병합 전 `review --scope branch --base f22bbc8` 1회 권장).

## 6. 결정 · 목업 차이
- 돌아가기 = 아이콘 모양 버튼이지만 `chevron-left` 원본 SVG가 아닌 CSS 테두리 chevron(번들 사유, 접근 이름 동일) — EM 추가 후보.
- 편집 알림 글자는 영역을 빈 채 먼저 그린 뒤 `setTimeout 0`으로 넣는다(낭독 보장 + lint `set-state-in-effect`).
- `useEntryState`는 `editNotice` 또는 `changes`가 있을 때만 "편집 시작 도착"으로 본다(포커스 대상 판정).
- 저장소 `getDoc` 결과는 `PageDoc`으로 캐스팅(메모리 구현 문서는 엔진이 만든 것만 — `useStudioDoc.ts` 주석).

## 7. 남은 위험 · 필요한 결정
1. **`/profile` 여유 확보(차단)**: S2~S6 재개 전 profile-headroom 계열 레인으로 여유를 늘리거나(권장), 멈춤선 재기준을 Jarvis가 결정해야 한다.
2. 툴바 `header`는 앱 셸 `main` 안이라 banner 랜드마크가 아니다(E-AC-03 "header 1개"는 태그 개수로 검증 예정, `AppLayout` 수정 금지) — 설계 질문.
3. 실제 브라우저에서 `history.replaceState` 뒤 뒤로/앞으로 동작은 미검증(병합 뒤 QA).

---

# RESUME-1 — S2~S6 + S7 A2-F 연결 (2026-09-27)

> 제목 갱신: S1(병합 `e13f2b6`) 뒤 같은 레인 재개. base = `d216990`(main `e13f2b6` + 브리프). 위 1~7절은 S1 시점 기록(이력 보존).

## R1-1. 커밋
| 체크포인트 | SHA | 내용 |
|---|---|---|
| S2 | `359f152` | 툴바 `document.title` "<이름> 편집" · E-AC-03 테스트(`pages/StudioShell.test.tsx` 신규) |
| S3 | `ee02439` | `features/studio/layoutMode.ts` · 배치 3벌(3단·2단·탭) · `StudioPanels`(편집 알림·섹션 nav·테마·편집·게이트 자리) · `StudioTabs` · `StructureCanvas`(초판) · 페이지 정보 줄 |
| S4 | `1a064a7` | 캔버스 선택 테두리·라벨 칩 · 포인터 선택(위임) · `scrollIntoView` · 1024 `select` 동기 |
| S5 | `3c1d624` | 탭 ←/→·Home/End 자동 활성(`rovingRowTargetIndex`) |
| S6 | `98a1303` · `3712b29` | `PreviewWidth` · `features/studio/previewFrame.ts`(프레임 폭·축소 비율·캡션) · 라벨 칩 caption2(12px) |
| S7 | `09703fc` | `EditFields` · `features/studio/{studioRepository,canvasIssues}.ts` · SaveStatus·ConflictCallout·useDocSave 연결 · 편집 틀 lazy · 번들 스크립트 분류 · tabsRemoved 가드 범위 |

## R1-2. 파일 (app/)
- 수정: `src/pages/StudioPage.tsx`(lazy) · `src/components/studio/{StudioLayout,StudioToolbar,SectionList}.tsx` · `src/features/studio/{selection,useStudioDoc}.ts` · `scripts/check-bundle-size.mjs`(studio auto 1줄) · `src/test/tabsRemoved.test.ts`(예외 1개)
- 신규: `src/components/studio/{StudioPanels,StudioTabs,StructureCanvas,PreviewWidth,EditFields}.tsx` · `src/components/studio/StudioLayout.test.tsx` · `src/features/studio/{layoutMode,previewFrame,studioRepository,canvasIssues}.ts` · `src/features/studio/previewFrame.test.ts` · `src/pages/StudioShell.test.tsx`
- A2-F 소유 파일(`FieldEditor`·`PageInfoFields`·`SaveStatus`·`ConflictCallout`·`useDocSave`·`fieldCounter`·`useAutosaveScheduler`·`saveStatusText`)과 그 테스트: **수정 0**(import만). `AppLayout.tsx`·`design/`·`docs/design/`·`engine/**` 수정 0. 새 의존성·아이콘 0. 브리프 소유 목록 밖 신규 = `StudioPanels`·`EditFields`·`previewFrame`·`studioRepository`·`canvasIssues`(모두 studio 폴더, F 파일과 겹침 없음).

## R1-3. AC 판정
| AC | 판정 | 근거 |
|---|---|---|
| E-AC-03 집중 모드 | PASS | `StudioShell.test.tsx` S2 — 주 메뉴 nav 없음 · banner 1 · 돌아가기 → `/projects` · h1 1 · title "<이름> 편집" |
| E-AC-04 제목 구조 | PASS(자리 포함) | S3 1280·1920 — h2 섹션·테마·구조 미리보기·편집 · Hero·품질 게이트 + h3 내보내기. 게이트·내보내기 **내용은 a4** — 제목·안내 캡션만 |
| E-AC-05 섹션 선택 | PASS | S4 4건 — aria-current·편집 h2·라벨 칩 동기, 포커스 = 누른 줄, 캔버스 안 포커스 가능 요소 0, 포인터 선택, 1024 select 동기 |
| E-AC-13 배치 | PASS [V] · [Q] 남음 | S3 — 1280·1920 3단 · 1024 2단(select + details 기본 접힘) · 768·390 탭 3개, 4.3 DOM 순서(= Tab 순서, 배치별 트리). **가로 넘침 0은 jsdom으로 증명 불가 → QA** |
| E-AC-14 탭 | PASS | S5 3건 — 속성 · ←/→·Home/End 순환 자동 활성 · 탭 바꿔도 선택 유지. 입력 값 유지 = 패널 모두 그려 두고 `hidden`(구조상), 전용 단언은 선택만 |
| E-AC-15 미리보기 폭 | PASS(변형) · 1초 [Q] | 라벨 = `PREVIEW_VIEWS`와 **같은 값**(대조 테스트) — 값 import는 번들 규칙 때문에 하지 않음(R1-6). 전환 뒤 문서·선택 유지, 축소 캡션 `previewFrame.test.ts` |
| E-AC-16 캔버스 | PASS | S6 3폭 — 캡션 늘 보임 · img/src/URL 0 · opacity·알파 글자 0 · 라벨 칩 `text-caption2`(12px) 700 · hex 0(`noHardcodedStyle` 통과) |
| E-AC-33 편집 알림 | PASS | S1 테스트 + S3(배치마다 1개, <1024 탭 목록 아래) + S7(평상시 저장으로 글자 변화 0 · 충돌에도 1개) |
| S7 수용: 입력 → 2초 뒤 저장 1회 → "이 탭에 저장됨" | PASS | `StudioLayout.test.tsx` 가짜 타이머 1999ms 0회 → 2000ms 1회, 저장 문서에 새 값, 툴바 글자 |
| S7 수용: 필드 값 → 캔버스 반영 | PASS | 같은 테스트 — 캔버스에 "새 제목" |
| S7 수용: 섹션 전환 → 필드 교체 | PASS | Hero → About 필드 교체, 페이지 정보 → 제목·설명 |
| E-AC-06 describedby에 캔버스 문장 id | PASS | 권장 초과 → 캔버스 문장 "제목이 권장 28자를 넘었습니다 (30/28자)" + "경고 1" 배지, 필드 describedby 맨 앞 = 그 id |
| E-AC-10 충돌(화면) | PASS(연결분) | STALE_DOC → 캔버스 위 Callout "(r7)" · 내 편집 유지. 스냅샷은 a4(만들지 않음) |
| A2-F 부품 테스트 불변 | PASS | F 소유 테스트 파일 diff 0, 전체 vitest 포함 통과 |

## R1-4. RED → GREEN 로그 (`dev/active/editor-a2-shell/logs/`)
| 단계 | RED | GREEN |
|---|---|---|
| S2 | `s2-red.txt` 1 fail(title) | `s2-green.txt` 8/8 |
| S3 | `s3-red.txt` 5 fail | `s3-green.txt` 14/14 |
| S4 | `s4-red.txt` 2 fail | `s4-green.txt` 18/18 |
| S5 | `s5-red.txt` 1 fail(키) | `s5-green.txt` 21/21 |
| S6 | `s6-red.txt` 5 fail + 모듈 없음 | `s6-green.txt` 30/30 |
| S7 | `s7-red.txt` 5 fail | `s7-green.txt` 31/31 · `s7-targeted.txt` 176/176(studio·가드) |
- 기존 테스트 단언 수정: `tabsRemoved.test.ts` 1건(범위 조정 — R1-6·R1-7). 그 밖 0.

## R1-5. 번들 (gzip KB, 체크포인트마다 `npm run build` exit 0 — `logs/{r1-base,s2..s7}-build.txt`)
| 시점 | 공통 | /catalog 첫 | /references 첫 | /compare 첫/진입 | /profile 첫/진입 | /projects 첫/진입 | /studio 첫/진입 |
|---|---|---|---|---|---|---|---|
| base d216990 | 89.36 | 99.66 | 97.01 | 98.77 / 121.40 | 99.62 / 123.66 | 93.98 / 107.02 | 95.49 / 108.46 |
| S2 | 89.35 | 99.66 | 97.00 | 98.77 / 121.40 | 99.62 / 123.65 | 93.98 / 107.02 | 95.50 / 108.48 |
| S3 | 89.35 | 99.66 | 97.00 | 98.76 / 121.40 | 99.61 / 123.65 | 93.98 / 107.02 | 97.28 / 110.25 |
| S4 | 89.35 | 99.66 | 97.01 | 98.77 / 121.41 | 99.61 / 123.66 | 93.98 / 107.03 | 97.45 / 110.43 |
| S5 | 89.36 | 99.66 | 97.01 | 98.77 / 121.41 | 99.62 / 123.66 | 93.98 / 107.02 | 97.76 / 110.73 |
| S6 1차(값 import, 되돌림) | 89.39 | 99.70 | 97.18 | 98.80 / 121.45 | 99.65 / 123.70 | 94.01 / 107.05 | 98.64 / 111.62 |
| S6 | 89.35 | 99.66 | 97.00 | 98.76 / 121.40 | 99.62 / 123.66 | 93.98 / 107.01 | 98.39 / 111.36 |
| S7 | 89.34 | 99.64 | 96.99 | 98.75 / 121.39 | 99.60 / 123.64 | 94.00 / 107.04 | **91.65 / 118.83** |
- `/studio` 첫 ≤ 99.40 ✓ (S7 91.65 — 편집 틀 lazy). 진입 118.83 ≤ 125. 그 밖 화면·공통 base 대비 최대 ±0.02 ✓. 여유 최소 = /catalog 첫 0.36 · /profile 첫 0.40 — 멈춤선 0.3 미발동.

## R1-6. 결정 · 목업/SPEC 차이 (ADR-003)
- **E-AC-15 "같은 상수 import" → 같은 값 + 대조 테스트**: `PREVIEW_VIEWS` 값을 import하면 previewView가 공유 청크로 빠져 /references 첫 +0.17 · 공통 +0.03(S6 1차 실측) — "그 밖 화면 ±0.03" 규칙 위반. `PREVIEW_WIDTH_OPTIONS` + `previewFrame.test.ts` `toEqual(PREVIEW_VIEWS)`. 결정 필요(아래 R1-8).
- 축소 보기 = CSS `zoom`(SPEC 4.1은 `transform: scale`) — scale은 원래 폭을 레이아웃에 남겨 가로 넘침이 생긴다. 데스크톱 프레임 = 열 폭, 태블릿 48rem · 모바일 24.375rem.
- 미리보기 폭 = 네이티브 라디오 `fieldset`(DS SegmentedControl 대신, 청크 경계 회피). 1024 "섹션" = 네이티브 `select`.
- 캔버스 = 자체 블록(막대 + 실제 슬롯 글자, 앱 토큰 색). `CandidateCard` `Wireframe` import 안 함(글자 슬롯 없음·/profile 청크 공유 위험). 프로필 팔레트 CSS 변수 연결은 테마(a3)와 함께.
- 품질 게이트·내보내기·스냅샷·"더보기"·"검사 · 내보내기" = a4 → 제목·캡션 자리만. 테마 바꾸기·섹션 연산·이미지 슬롯 = a3 → "프로필 보기" 링크, 이미지 슬롯 안내 캡션.
- `document.title` = "<이름> 편집"(AC 문자 그대로, 다른 화면의 " · 브랜드" 접미사 없음).
- 번들: 편집 틀 전체(StudioLayout)를 문서가 있을 때 자동 lazy — 첫 화면에는 조회·빈 상태만. 진입 전환에 LoadingState 한 번 더(체감 차이는 QA 확인).
- 타입: `isPageDoc` 모양 확인 + `toDocSaveRepository` 어댑터(캐스트 제거). 데이터 계층 파일 수정 0.
- 유추 문장: 충돌 해결 거부 "충돌을 해결하지 못했습니다 — 다시 골라 주세요" · 캔버스 차단 "<라벨> — 상한 N자를 M자 넘었습니다 …(R-13)" · 이미지 슬롯 안내 · 게이트 자리 "검사 항목은 준비 중입니다." · 페이지 정보 줄 캡션 "검색 제목 · 설명".

## R1-7. 검증 명령 · 결과
- 체크포인트마다 `/tmp/gate.sh <단계>` = `npm run typecheck` · `npm run lint` · `npm run build` 모두 exit 0 (`logs/<단계>-{typecheck,lint,build}.txt`).
- 전체 vitest 3회 `logs/final-full-x3.txt`(Codex r1 반영 뒤 최종 코드): 3회 모두 exit 0 · 122 파일 · **1351 passed · 실패 0**(load 7 → 48 구간). ProjectsPage J-S07 간헐 실패 이번에는 미발생. (반영 전 3회도 1349 passed · 실패 0)
- 최종 build `logs/codex-r1-build.txt` exit 0: /studio 첫 91.64 · 진입 118.88, 그 밖 base ±0.02.
- **발견 사항**: `src/test/tabsRemoved.test.ts`(V2-3 "제품 코드 role=tab* 0건")는 S3 커밋(`ee02439`)부터 S6까지 빨간색이었다 — 체크포인트 게이트가 표적 테스트만 돌렸기 때문. S7 표적 실행(studio·`src/test` 가드)에서 발견, `StudioTabs.tsx` 1개만 명시 허용으로 정리(카탈로그·상세 0건 단언 유지). 그 사이 커밋은 단독으로는 전체 vitest 1건 실패 상태.
- 서버·브라우저: 미기동(포트 4337 사용 0). 문서 있는 편집기에 가려면 보드 → 프로필 → 3안 → 편집 시작의 긴 클릭 흐름이 필요(새로고침 시 메모리 store 초기화) — 브리프상 QA 몫. 가로 넘침·1초 전환·실제 zoom 모양은 [Q].

## R1-8. Codex 검증 (1회 — `review --scope branch --base e13f2b6`, `logs/codex-review.txt`)
- [P2] 편집 직후 "프로젝트로 돌아가기"(앱 안 이동)를 누르면 2초 디바운스 전 편집이 틀 unmount와 함께 버려짐 → **반영**: 틀 루트 `onClickCapture` — 링크(`a[href]`) 클릭이면 `retry()`로 저장 전 변경을 즉시 저장(E-S10 "앱 안 링크는 막지 않는다" 유지). 언마운트 정리 단계에서는 같은 컴포넌트의 스케줄러 dispose가 먼저라 쓸 수 없음. RED `logs/codex-r1-red.txt`(1 fail) → GREEN 33/33 `logs/codex-r1-green.txt`, 변경 없음 → 저장 0 테스트 추가.
- 라운드 1회로 마침(브리프 "1회"). 남은 한계: 저장 **중**에 또 편집하고 바로 떠나면 스케줄러의 "저장 뒤 한 번 더"가 dispose로 취소됨(F 소유 스케줄러 — 여기서 고치지 않음). 브라우저 뒤로 가기(링크 아님)도 같은 한계.

## R1-9. 남은 위험 · 필요한 결정
1. **E-AC-15 상수 공유 방식** — 값 import(±0.03 규칙 위반, /references +0.17) vs 현행(같은 값 + 대조 테스트). 규칙 완화 또는 `PREVIEW_VIEWS`를 공통으로 옮길지 결정 필요.
2. **`tabsRemoved.test.ts` 가드 범위 조정 승인** — 편집기 탭 1개 허용. S3~S6 중간 커밋은 이 가드 1건이 빨간 상태였다(체크포인트 게이트가 표적 테스트만 실행).
3. [Q] 5폭 가로 넘침 0 · 1초 폭 전환 · `zoom` 축소 실제 모양 · 편집 틀 lazy로 생기는 진입 LoadingState 2단계 체감 — 브라우저 미확인(QA 포트 4341).
4. 캔버스 색 = 앱 토큰(프로필 팔레트 아님), 게이트·내보내기 자리 문구, 이미지 슬롯 미편집 — a3·a4 범위.
5. 저장 중 편집 + 즉시 이탈, 브라우저 뒤로 가기 — R1-8 한계.
- 서버: 4337 미기동, `lsof -nP -iTCP:4337 -sTCP:LISTEN` 빈 출력(exit 1).
