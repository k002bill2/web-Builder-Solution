# 2A-04a2 REPORT — 프로필 화면(`/profile`·`/profile/:id`) + 앱 배선

- 브리프 `docs/06-handoff/2A-04a2_DEVELOPER_BRIEF.md` · SPEC r4 · 분기점 `5ef338f` · 로컬 커밋만(push·원격 없음)
- 결론: A-Q1·A-Q3 반영, 배선 후 첫 실측 여유 1.37KB(대안 불필요), 목록·상세 화면 P-AC-01~10(화면)·41·33·34·37(되돌리기) 충족. 검증 4종 통과(53 files / 587 passed), Codex 지적 0건. 설계 질문 9건. **브라우저 캡처 이미지는 남기지 못함**(6절).

## 1. 변경 파일 (app/)
| 구분 | 파일 |
|---|---|
| A-Q1·Q3 | `domain/profile.ts`(`ProfileVersion.baseReferenceId`) · `data/studioStore.ts`(store 메타·`baseReferenceIdOf` 제거, `insert(record)`) · `data/memoryProfileRepository.ts`(요약은 필드에서, 되돌리기 = 대상 값 복사, 최신 거부) · `data/memoryCompareBoardRepository.ts`(확정 레코드에 초안 값) |
| 배선 | 새 `data/memoryStudio.ts`(store 하나로 보드·프로필) · `data/sharedLoader.ts`(실패 비캐시) · `data/deferredProfileRepository.ts` · `data/ProfileRepositoryContext.tsx` · `app/AppProviders.tsx`(prop `profileRepository` 1개 — 생성 저장소는 2a-04c) · `main.tsx`(로더 하나) · `test/renderApp.tsx`(뒤에 선택 인자 `profileRepository`, 기본 = 렌더마다 store 하나) · `scripts/check-bundle-size.mjs`(4절) |
| 화면 | `pages/ProfilePage.tsx` · `components/profile/{ProfileValues,PaletteContrast,VersionList,VersionDiff,ProfileList}.tsx` · `features/profile/{profileFields,profileDiff,profileMessages,profileEngine,profileEvents,useProfileDetail,useProfileList,versionText}.ts` · `domain/profileContrast.ts` · `domain/contrast.ts`(`ContrastCheckId` C-4·C-5) · `app/routes.tsx`(`/profile*` → `ProfilePage` lazy, `/studio` 자리표시 유지) |
| 테스트 | 새 `data/studioWiring.test.ts`(6) · `domain/profileContrast.test.ts`(15) · `features/profile/profileDiff.test.ts`(4) · `pages/ProfilePage.test.tsx`(17) · `test/studioFixtures.ts`(헬퍼) · `data/profileLineage.test.ts`(+2, 셋업 수정) · `pages/CompareBoardLineage.test.tsx`(셋업 수정) · `pages/CatalogPage.test.tsx`(2행 제거) |

## 2. A-Q1 · A-Q3 결과
- **A-Q1**: `ProfileVersion.baseReferenceId` 필드. 보드 확정 = 초안 `baseReferenceId`, 되돌리기 = 대상 버전 값 복사, `ProfileSummary`는 최신 버전 필드에서 읽음. 테스트 `profileLineage › A-Q1 … 보드 확정 = 초안의 기준 레퍼런스, 되돌리기 = 대상 버전 값 복사, 목록은 최신 버전 필드에서 읽는다`(v1 ref-a → v2 ref-c → v1 되돌리기 v3 = ref-a).
- **A-Q3**: 최신 버전으로의 `revertTo` → `SCHEMA_INVALID` "이미 최신 버전입니다", 새 버전 0. 판정 순서 NOT_FOUND → STALE_PROFILE → 이미 최신(STALE이 최신 계열을 동봉하므로 먼저). 테스트 `profileLineage › P-AC-10 › A-Q3: …`.
- 부수 효과: a1 테스트 7건이 "다른 탭 쓰기"를 최신 버전 되돌리기로 흉내 내고 있어 깨짐(`logs/green-1-broken-by-aq3.txt`) → 셋업을 `insertOtherVersion`(store에 최신 복사 `adjust` 버전)으로 교체(설계 질문 1).

## 3. 배선 후 첫 번들 실측 (gzip KB, `logs/probe1-wiring-build.txt`)
| | 기준 `5ef338f` | 배선 후 | 차이 |
|---|---|---|---|
| 공통 | 88.69 | 88.80 | +0.11 (`ProfileRepositoryContext`·deferred 래퍼·공유 로더·prop) |
| `/catalog` 첫 화면 | 98.53 | 98.63 | 여유 1.37 |
| `/compare` 첫 / 진입 직후 | 98.53 / 121.74 | 98.63 / 122.25 | 여유 1.37 / 2.75 |
- 여유 ≥ 0.3 → 대안(싱글턴 + reset · C8) 불필요, 예산 무변경.
- 발견: 로더를 `memoryStudio`로 합치자 manifest에서 `memoryCompareBoardRepository.ts` 키가 사라져 `/compare` 진입 직후 합계가 **조용히 줄어들 뻔함** → 목록을 `memoryStudio.ts`로 교체하고, 진입 직후 목록 키가 manifest에 없으면 실패하는 가드를 넣음(예산 상수 무변경).

## 4. 최종 번들 전/후 (gzip KB, 첫 화면 / 진입 직후, `logs/verify-build.txt`)
| 라우트 | 기준 `5ef338f` | 최종 | 여유(최종) |
|---|---|---|---|
| 공통 | 88.69 | 88.93 (+0.24) | — |
| `/catalog` | 98.53 / 100.92 | 98.98 / 101.36 | 1.02 / 23.64 |
| 상세 `/references/:id` | 95.86 / 98.25 | 96.31 / 98.70 | 3.69 / 26.30 |
| `/compare` | 98.53 / 121.74 | 99.17 / 123.33 | **0.83** / 1.67 |
| `/profile` (신규) | 자리표시 89.15 / 91.54 | **98.61 / 117.25** | 1.39 / 7.75 |
| `/studio` 자리표시 | 89.15 / 91.54 | 89.39 / 91.77 | — |
- 공통 증가 내역: 배선 +0.11(P-B2) · 라우트 교체·preload 목록 +0.13(P-B1). 아이콘 파일 추가 0, 새 의존성 0.
- `/compare`·`/catalog` 첫 화면 증가(+0.54·+0.45) = 공통 +0.24 + **P-B7 공유 청크 분할**(`Callout`이 보드·프로필 두 라우트에서 쓰여 별도 청크로 갈라짐, 경계 비용). 예산 안이라 대안 없이 기록.
- `/profile` 첫 화면 청크 6.63(화면 틀·값·견본·버전 목록), 엔진 `profileEngine` 1.95(대비·보정·비교·요약·문구, P-B6). 진입 직후 목록 = 엔진 + `memoryStudio` + 비교 픽스처(`/compare`와 같은 관례).

## 5. AC별 테스트 (파일 › 이름)
| AC | 테스트 |
|---|---|
| P-AC-01 | `ProfilePage` › "비교 보드에서 확정하면 /profile/profile-1에 h1 '디자인 프로필' · 'v1 · 현재' · 3.1 필드가 모두 보인다" · `profileDiff` › "구성 요소는 라이브러리 이름표 + 변형 키 캡션…" |
| P-AC-02 | `ProfilePage` › "없는 id → h1 '프로필을 찾을 수 없습니다' + …, role=alert 없음" |
| P-AC-03 | `ProfilePage` › "프로필 0 → 시작 안내…" · "프로필이 있으면 줄마다 기준 레퍼런스 제목 · 최신 버전 · 열기 링크" |
| P-AC-04 | `ProfilePage` › "제목 링크 · 업종 · 라이선스, 회수된 출처는 '출처 회수됨' 글자 + 링크 없음, 이미지·외부 URL 0" |
| P-AC-05 | `profileContrast` › "checkProfileContrast … (ref-a~ref-f 6건)" · "강화(7.0)…" · "AA ref-a/c/d/e/f" · "ref-a muted 보정 = C-5 3.8 → 4.5, 명도 −3.9%p" · `ProfilePage` › "ref-a: C-1·C-2·C-4 통과 · C-5 3.8:1 미달…" |
| P-AC-06 | `profileContrast` › "ref-b(어두운 카드) ink는 충돌…" · "강화에서도 ref-b ink 충돌(#5B4722, C-3 1.8)…" · `ProfilePage` › "ref-b(어두운 카드): C-3 7.3 통과, ink 보정은 충돌…" |
| P-AC-07 | `ProfilePage` › "버전 1개 → 한 줄 + '비교할 이전 버전이 없습니다'…" · "버전마다 번호 · 출처 · 요약 · 시각…" · `profileDiff` › "요약 = 직전 버전과의 차이 최대 2개 + '외 N'…" |
| P-AC-08 | `ProfilePage` › "'보기' → ?v=1, Callout 'v1을 보고 있습니다 · 현재 v2' + 되돌리기, Tag 'v1 · 이전 버전', 포커스 h1" (조정 컨트롤 부분은 설계 질문 5) |
| P-AC-09 | `ProfilePage` › "'현재와 비교' → 표(caption 'v1과 v2 비교')에 포커스…" · "같은 값 두 버전 … '두 버전의 값이 같습니다'" · `profileDiff` › "바뀐 줄만 changed…" · "같은 값 두 버전은 바뀐 줄 0" |
| P-AC-10 | `profileLineage` › P-AC-10 3건 + A-Q3 · `ProfilePage` › "?v=1에서 되돌리기 → 새 버전 v3 · 알림 … · 포커스 새 버전 줄 …" · "되돌리는 중 연타해도 요청 1회 (aria-busy)" |
| P-AC-41 | `ProfilePage` › "화면이 v2를 본 뒤 다른 탭이 v3을 만들면 되돌리기 거부, 새 버전 0, 버전 라벨 갱신, ?v=1 유지" (+ 다시 되돌리면 v4) · 저장소 원자성은 `profileLineage` › P-AC-41 |
| P-AC-33·34 | `ProfilePage` › "DOM 순서 = 흐름…, disabled 속성·양수 tabindex 0, 프로필 색은 aria-hidden 견본에만" |
| P-AC-35 | 4절 표 |
| P-AC-36 | typecheck 0 · lint 0 · test **53 files / 587 passed**(기준 49 / 545, **+4 파일 / +42**: 새 44 − 제거 2) · build 0 (`logs/verify-*.txt`) |
| P-AC-37 | `ProfilePage` › 되돌리기 성공 `profile_saved {version 3, origin revert}` 1회 · 실패 `profile_save_failed {reason}` 1회(요청 오류 UNKNOWN · STALE_PROFILE) |
| 배선 | `studioWiring` 6건(store 공유·독립, 공유 로더 1회·실패 재시도, deferred 위임·재시도) |

## 6. RED 로그 · 고친 기존 테스트 줄
- RED ① `logs/red-1-aq1-aq3.txt` — 2 failed / 13 passed · A-Q3 부수 파손 `logs/green-1-broken-by-aq3.txt` 7 failed → GREEN `logs/green-1-aq1-aq3.txt` 547
- RED ② `logs/red-2-wiring.txt` — 모듈 없음 → GREEN `logs/green-2-wiring.txt` 553
- RED ③ `logs/red-3-pure.txt` — 모듈 없음 (대비·비교)
- RED ④ `logs/red-4-page.txt` — 자리표시 화면에서 **17 failed**(단언 실패) → GREEN `logs/green-4-page.txt` 17 · 전체 `logs/green-4-all.txt` 587
- 고친 기존 줄(커밋 `ac5d4fa`·`a82d7d9` diff):
  - `data/profileLineage.test.ts`(9절 표 밖, 설계 질문 1): P-AC-11 저장소 셋업 `revertTo(1,1)` → `insertOtherVersion(store)`, 기대 origin `[2,"revert"]` → `[2,"adjust"]` · P-AC-40 3건 첫 `revertTo(…,1,1)` → `insertOtherVersion` · P-AC-41 셋업에 `insertOtherVersion` + 두 쓰기 `expectedLatest` 1 → 2 · 기대 버전 `[1,2]` → `[1,2,3]`
  - `pages/CompareBoardLineage.test.tsx`(9절 표 밖): `boardSeesV2`의 `revertTo(1,1)` → `insertOtherVersion(studio.store)`, `openStudio` 반환에 `store`, 기대 origin `[2,"revert"]` → `[2,"adjust"]`, 머리 주석
  - `pages/CatalogPage.test.tsx` 354~356행(9절 표 안): `/profile*` 자리표시 2행 제거, `/studio`만 남김
- 깨지지 않아야 할 것 확인: `CompareBoardPage.test.tsx` `/profile/profile-1` 단언 · `AppHeader.test.tsx` `/profile` · `memoryCompareBoardRepository.test.ts`(무수정 통과)
- 플레이크: 전체 실행 1회에서 `CatalogPage` "초기화는 레일 필터만 지우고…"가 findBy 1초 대기 초과, 단독·재실행 통과(코드 변경 무관, 부하 시 타이밍).

## 7. 브라우저 스모크 (127.0.0.1:5299, ego-browser, `logs/smoke-browser.txt`)
- 카탈로그 → 모던 카페·동네 치과 비교 추가 → `/compare` Hero A → "프로필 확정 (v1)" → `/profile/profile-1` "v1 · 현재" → "비교 보드에서 선택 바꾸기" → 팔레트 B → "새 버전으로 확정 (v2)" → "v2 · 현재" → "보기 (v1)" → `?v=1`, 포커스 H1 → "현재 버전 보기" → "현재와 비교 (v1)" → caption "v1과 v2 비교" 포커스·바뀜 5줄 → 닫기 → v1 보기 → 되돌리기 → "v3 · 현재", 알림 "v1 내용으로 v3을 만들었습니다", 포커스 "v3 되돌리기 (v1)" 줄 → GNB `/profile` → "모던 카페 브랜드 최신 v3 방금 열기".
- 1280·768·390(`Emulation.setDeviceMetricsOverride`)에서 v1·`?v=1`·비교·목록 모두 `scrollWidth = innerWidth`(가로 넘침 0).
- **캡처 이미지 없음**: ego 창이 최소화 상태(실제 뷰포트 80×86)라 `Page.captureScreenshot`이 매번 시간초과, 창 복원(`Browser.setWindowBounds`)은 "No web contents" 오류. 좌표 클릭도 불가해 흐름 후반은 DOM `click()`으로 진행. 캡처는 QA(P-AC-32) 또는 창을 띄운 환경에서 다시 필요.
- 서버 종료 후 `lsof -iTCP:5299 -sTCP:LISTEN` 결과 없음.

## 8. Codex 리뷰
- 1회: `node codex-companion.mjs review --wait --scope branch --base 5ef338f` (원문 `logs/codex-review.txt`).
- 결과: **지적 0건** — "수정이 필요하다고 판단할 만한 구체적인 버그는 찾지 못했습니다"(Codex 쪽 테스트 직접 실행은 읽기 전용 환경이라 중단). 반영할 사항 없음.

## 9. 설계 질문
1. **A-Q3가 깨뜨린 a1 테스트(9절 표 밖)**: 최신 버전 되돌리기로 "다른 탭 쓰기"를 흉내 내던 셋업 9곳을 store 직접 삽입 헬퍼(`insertOtherVersion`, origin `adjust`)로 바꿨다. 단언 번호는 유지, origin 기대만 `revert` → `adjust`. 이 수정 범위 승인 필요.
2. **선택 값 이름표 없음**: `cta_placement`·`media_ratio`·`mobile_pattern`·`card_style.style`은 라이브러리 이름표가 없어 저장값(`hero-inline` 등)을 그대로 보인다(비교 셀 라벨은 레퍼런스별 픽스처에만 있음). 이름표 출처(라이브러리 확장 · 서버 응답) 결정 필요.
3. **"현재와 비교" vs URL `&diff=m`(v와 m 비교)**: 이전 버전을 보는 중(`?v=1`)에 v2 줄의 "현재와 비교"를 누르면 SPEC URL 정의로는 v1↔v2, 버튼 이름으로는 v2↔현재다. 버튼 이름대로 **m ↔ 최신**으로 구현했다. 확인 필요.
4. **P-AC-37 실패 이벤트 이름**: 6.5에 되돌리기 실패 이벤트가 없어 `profile_save_failed(reason = 오류 코드 | UNKNOWN)`로 두었다(수집기 없음 → `window` 이벤트 `studio:profile`). 이름·전달 방식 확정 필요.
5. **P-AC-08 "조정 컨트롤 aria-disabled + 이유"·h2 "전역 조정"·"3안"**: 컨트롤·3안은 2a-04b·c라 이번 화면에 h2를 두지 않았다(빈 영역 대신 생략). 1280 2단(프로필 패널 + 3안)도 3안이 생길 때로 미룸 → 지금은 1단. 각 단계에서 넣는 것으로 맞는지 확인.
6. **"보정값 쓰기"**: 조정 저장이 2a-04b라 충돌 아닌 제안에도 버튼을 두지 않고 문장·전후 견본만 보인다(P-AC-06 충돌 쪽 "없음"은 충족).
7. **P-S02 "비교 보드로 버튼"**: 이동이므로 버튼 모양의 링크(`<a href="/compare">`)로 구현했다(P-S04도 같음).
8. **번들 스크립트 측정 정의 변경**: `/compare` 진입 직후 목록 `memoryCompareBoardRepository.ts` → `memoryStudio.ts`, `/profile` 목록 신설(엔진 + memoryStudio + 비교 픽스처), 목록 키 누락 시 실패 가드. 예산 상수는 무변경. 승인 필요.
9. **없는 `?v=`·최신과 같은 `diff`**: 조용히 최신 보기·비교 닫힘으로 둔다(안내 없음).

## 10. 남은 위험
- **`/compare` 첫 화면 여유 0.83KB** — 2a-04b의 P-S25 패널·`carryOverAdjustments`(P-B9)가 보드 청크에 들어가면 첫 화면 초과 가능. P-B7 `Callout` 분할 비용 포함. 2a-04b 첫 작업으로 재측정 권장.
- `/catalog` 첫 화면 여유 1.02KB(공유 청크 분할 영향).
- 문서 제목: `CompareBoardPage`가 설정한 "비교 보드 · Design Studio"가 `/profile*`에서도 남는다(기존 동작, 다른 페이지는 제목을 안 바꿈) — 범위 밖, 별건.
- 브라우저 캡처 이미지 부재(7절).
- (FIX 12.4) `ProfilePage` P-AC-01 플레이크: lazy 라우트 전환 중 `h1()`이 "비교 보드" h1을 잡음(3회 중 1회). 대기 조건을 이름("디자인 프로필")으로 좁히는 수정은 별건.
- 목록 순서 = 계열 생성 순(SPEC 미지정, a1과 같음). 시각 표기는 렌더 시점 기준이라 자동 갱신 없음.

## 11. 커밋
- `ac5d4fa` feat — A-Q1 필드 · A-Q3 거부 (+ a1 셋업 교체)
- `ed23f67` feat — 앱 배선 (store 공유 로더·컨텍스트·renderApp) + 첫 실측
- `a82d7d9` feat — `/profile` 목록 · `/profile/:id` 상세 화면
- 이 REPORT·PROGRESS·검증·스모크·Codex 로그 커밋(해시는 최종 응답)

## 12. FIX (Q3·Q9) — 버전 비교 URL 계약 · 없는 버전 안내 (브리프 `docs/06-handoff/FIX-2A04a2_DEVELOPER_BRIEF.md`, base `679deef`)
- 결론: 비교 쌍 = (`?v=` 버전 또는 최신, `diff`)로 바로잡고, 이전 버전을 볼 때 버튼 "vN과 비교", 같은/없는 `diff`는 닫힘. 없는 `?v=`는 최신 + `role=status` 안내. F-1~F-5 GREEN, 기존 테스트 수정 **0줄**, `/compare`·`/catalog` 첫 화면 증가 0.

### 12.1 변경 파일 (app/)
- `src/pages/ProfilePage.tsx` — `diff` 정규화 기준 최신 → 보는 버전, 표 쌍 `ordered(diff, viewed)`(작은 번호 먼저), 없는 `?v=` 안내(`<div role="status">` + `Callout tone=info`)
- `src/components/profile/VersionList.tsx` — 비교 버튼 조건 `!current` → `!viewed`, 이름 = 최신을 볼 때 "현재와 비교" · 이전 버전 vN을 볼 때 "vN과 비교"(`aria-label` "… (v행)")
- `src/features/profile/versionText.ts` — `missingVersionText(requested, latest)` 문구(양의 정수면 "요청한 v7이", 아니면 "요청한 버전이")
- `src/pages/ProfilePage.test.tsx` — describe "FIX-2A04a2 Q3 … · Q9 …" 추가(9개 케이스)

### 12.2 수용 기준 → 테스트 (`ProfilePage.test.tsx` › FIX-2A04a2 …)
| AC | 테스트 이름 |
|---|---|
| F-1 | `F-1 v3 계열 ?v=1&diff=2 → caption·표 = v1↔v2 (v3 열 없음)` |
| F-2 | `F-2 ?diff=2(v 없음) → v2↔최신 v3` |
| F-3 | `F-3 ?v=1에서 v2 줄 'v1과 비교 (v2)' → ?v=1&diff=2 · 포커스 caption · 닫기 → 같은 버튼` (v1 줄 비교 버튼 없음 · v3 줄 "v1과 비교 (v3)" 포함) |
| F-4 | `F-4 ?v=2&diff=2 / ?diff=9 / ?diff=3 → 비교 닫힘(표·같음 문장 없음)` (`it.each`, `?diff=3`=최신 보는 중 최신 diff 추가) |
| F-5 | `F-5 ?v=7(v3 계열) → 최신 v3 + role=status '요청한 v7이 없어 최신 v3을 보여 줍니다'` · `F-5 ?v=abc → '요청한 버전이 없어 최신 v3을 보여 줍니다'` · `F-5 ?v=3·?diff=9 → 요청 버전 안내 없음` |

### 12.3 RED 로그 · 고친 기존 줄
- RED `logs/fix-red.txt` — **5 failed / 4 passed**(단언 실패: F-1 표 "v1과 v2 비교" 없음 · F-3 v1 줄에 "현재와 비교" 있음 · F-4 `?v=2&diff=2`에 표 있음 · F-5 두 문구 없음). 통과 4건(F-2, F-4 `?diff=9`·`?diff=3`, 안내 없음)은 기존 동작이 이미 맞는 회귀 가드.
- GREEN `logs/fix-green-page.txt` — ProfilePage 26/26.
- 고친 기존 줄: **없음**. P-AC-07(최신 보기의 "현재와 비교 (v1)")·P-AC-09(`?diff=1` = v1↔최신)는 최신을 보는 경우라 새 규칙에서도 기대가 같다.

### 12.4 검증 4종 (`logs/fix-verify-*.txt`)
- typecheck exit 0 · lint exit 0 · build exit 0(번들 검사 포함)
- test: **첫 전체 실행 1 failed / 595 passed**(`fix-verify-test.txt`) — `P-AC-01 보드 확정 → 프로필 화면`에서 `h1()`이 lazy 라우트 전환 중 남은 "비교 보드" h1을 잡음(기대 "디자인 프로필"). 이 테스트는 `?v`·`diff`를 쓰지 않는 기존 경쟁 조건(5절 플레이크와 같은 종류). 재실행 2회 **596/596 통과**(`fix-verify-test-rerun1.txt`·`rerun2.txt`). 브리프 범위(쌍 관련 기대만 수정) 밖이라 고치지 않음 → 10절 남은 위험에 추가.

### 12.5 번들 전/후 (gzip KB, 첫 화면 / 진입 직후, `logs/fix-baseline-build.txt` → `logs/fix-verify-build.txt`)
| 라우트 | 전 `679deef` | 후 | 차이 |
|---|---|---|---|
| 공통 | 88.93 | 88.93 | 0 |
| `/catalog` | 98.98 / 101.36 | 98.98 / 101.36 | **0** / 0 |
| 상세 `/references/:id` | 96.31 / 98.70 | 96.31 / 98.69 | 0 / −0.01 |
| `/compare` | 99.17 / 123.33 | 99.16 / 123.32 | **−0.01** / −0.01 (청크 해시 문자열 차이) |
| `/profile` | 98.61 / 117.25 | **98.80** / 117.44 | +0.19 / +0.19 (`ProfilePage` 청크 6.65 → 6.84) · 여유 1.20 |
| `/studio` 자리표시 | 89.39 / 91.77 | 89.38 / 91.77 | — |
- 새 의존성 0 · 아이콘 추가 0 · `design/` 수정 0.

### 12.6 Codex 리뷰 (1회, `review --wait --scope branch --base 679deef`, `logs/fix-codex-review.txt`)
- **지적 0건**: "비교 쌍 처리와 없는 버전 안내에 문제를 찾지 못했습니다". Codex 쪽 `npm test` 실행은 샌드박스 파일 쓰기 권한 오류(EPERM)로 시작되지 않음 → 테스트 증거는 12.3·12.4의 로컬 실행 로그.

### 12.7 설계 질문
1. **안내 영역 role**: `Callout.tsx` 주석(A-9)은 "role 없는 정적 영역, 새 경고는 알림 영역 문장으로" 규칙인데, 브리프 Q9대로 `<div role="status">`로 감쌌다. 내용을 가진 채 삽입되는 live region은 앱 안 뒤로/앞으로 이동 시 낭독되지 않을 수 있다. 기존 sr-only "프로필 알림" 영역에도 같은 문장을 낼지 결정 필요.
2. **숫자 경계값**: `?v=0`·`-1`·`01`·`?v=`(빈 값)은 모두 "요청한 버전이 없어…". 브리프 "범위 밖 숫자 → vN"을 문자 그대로 읽으면 `0`은 "요청한 v0이…"가 맞다. `01`은 v1과 헷갈려 일부러 제외. 확정 필요.
3. 없는 `?v=`가 URL에 남은 채 비교를 열면 `?v=7&diff=1`처럼 남는다(안내도 유지). 브리프 "URL은 건드리지 않아도 됨"에 따라 정규화하지 않음.

### 12.8 커밋
- `c1fe009` fix — 비교 쌍 · 없는 버전 안내 · F-1~F-5
- 이 REPORT 12절 · `logs/fix-*` 커밋(해시는 최종 응답)
