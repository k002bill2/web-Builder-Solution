# QA-2A04B2 REPORT — 2a-04b2(프로필 조정·대비 보정·P-S13·이름표·배치·보드 요약 바) + FIX F2 독립 검증

**판정: FAIL** — P1 1 · P2 0 · P3 2. 검증 4종은 통과했습니다(test 703/703, 1회). 번들은 모든 시나리오가 예산 안이고, 조정 저장 흐름(P-S10~S13)·F2는 실제 브라우저에서 SPEC r7대로 동작했습니다.
FAIL 사유는 **D-2A4B2-01(P1)**입니다. 대비 **"강화"**와 **어두운 카드**가 함께 있고 팔레트 primary가 중간 명도(예: 모던 카페 `#8B5E3C`)면 보정 제안 계산이 예외를 던집니다. 그러면 `/profile/:id` 화면 전체가 오류 경계("화면을 불러오지 못했습니다")로 떨어집니다. 강화를 저장한 뒤 보드에서 어두운 카드로 재확정하면, 저장된 새 버전이 **들어갈 때마다** 깨집니다. 복구 경로는 새로고침뿐이고, 새로고침하면 메모리 store가 비워집니다.

- 작성: Hermes QA · 2026-09-27 KST · 브리프 `docs/06-handoff/QA-2A04B2_QA_BRIEF.md` · 대상 HEAD `09e4885`(= main `1606886` + 브리프)
- 기준: `docs/design/2a-04/SPEC.md` r7(10.0.3 포함). ADR-003에 따라 목업 px는 비교하지 않았습니다.
- 환경: macOS · ego-browser(Chromium 152) · `vite preview` 127.0.0.1:4341(게이트 빌드 `dist`) · 원본 파일 속 문장은 데이터로만 취급했습니다.
- 근거 수준: 게이트·번들·브라우저 측정 = L1(로그·캡처) · 원인 추정 = L2(명시)

## 0. 계측 방법 (제품 코드 무변경)
- 2a-04ab와 같은 도구 `tools/expose-studio.mjs`를 썼습니다. CDP Fetch로 `memoryStudio` 청크 응답만 가로채 `createMemoryStudio` 반환값을 `window.__qaStudio`에 노출합니다(`patched = 1` 확인, `profiles` 객체 `Object.isFrozen = false`).
  - deferred 래퍼는 호출할 때마다 `(await resolve()).saveAdjustments`를 조회합니다. 그래서 `__qaStudio.profiles.*`를 감싸면 앱 호출에 그대로 반영됩니다.
  - 이것으로 실패·지연·STALE·좁은 범위를 주입했습니다. `src`·`dist` 파일은 바꾸지 않았습니다.
- 청크 대조는 쓰기 메서드를 직접 부르기 **전**에 끝냈습니다. 기대 집합은 `tools/manifest-closure.mjs`(정적 closure, 스크립트와 같은 규칙)로 계산했습니다 → `logs/manifest-chunks.txt`.
- 이동은 앱 링크·버튼 또는 `history.pushState + popstate`로 했습니다. 메모리 store라 새로고침하지 않았고, 예외는 D-2A4B2-01 재현용 새 문서뿐입니다.
- 이벤트는 `window.addEventListener("studio:profile")`로 쌓아 확인했습니다.

## 1. 기본 게이트 (1회, `logs/*.log`)
| 항목 | 결과 |
|---|---|
| typecheck | exit 0 |
| lint | exit 0 |
| test | **64 files · 703/703 통과, 1회**. 시간 초과 실패 0 → 단독 재실행 불필요 |
| build | exit 0, 번들 스크립트 통과 |
| 제품 코드 변경 | 이 작업 공간 변경 0: `git diff --stat 1606886 -- app design docs/design` 출력 없음, `git status --porcelain -- app design docs/design` 출력 없음 |

- 참고: 측정 중 병렬 레인이 main을 `8d81280`으로 옮겼습니다(NARROW 병합 — `VersionDiff`·`profileDiff`·SPEC 등). 그래서 `git diff --stat main -- …`에는 main 쪽 변경 10파일이 보입니다. 이것은 이 작업 공간의 변경이 아닙니다. 옮겨진 main은 `contrast`·`profileContrast`를 건드리지 않으므로 **D-2A4B2-01은 main `8d81280`에도 남아 있다고 추정**합니다(L2, main 재측정 안 함).

## 2. 번들 (gzip KB, `logs/build.log`)
| 시나리오 | 첫 화면 / 100 | 진입 직후 / 125 | 조작 뒤(예산 밖) |
|---|---|---|---|
| 공통 | 89.06 | — | — |
| /catalog | 99.35 | 101.74 | — |
| /references/:id | 96.70 | 99.09 | — |
| /compare · (조정 있음) | 99.59 | **124.58** (여유 0.42) | carryOverPanel +2.79 · memoryBoardConfirm +1.50 · profileAdjustments +1.66 · memoryProfileAdjust +2.08 |
| /profile | 99.27 | **124.59** (여유 0.41) | memoryProfileAdjust +1.74 |
| /studio | 89.50 | 91.88 | — |

- 수치는 b2 REPORT 13.4의 "F2 후"와 같습니다(`/profile` 124.59 · `/compare` 124.58). 모든 시나리오가 예산 안이고 멈춤선 0.3 위입니다.

## 3. 청크 요청 대조 (P-B9 · Q-F4-1 · Q-B2-4, 브라우저 `performance` resource)
| 시점 | 실제 JS 요청 | 대조 |
|---|---|---|
| `/profile` 새 문서 직접 진입(목록, 빈 상태) | index·react·ProfilePage·Callout·catalogFilters·profileEvents·profileRepository·referenceDisplay·sectionLibrary·useThrowToBoundary + memoryStudio·profileDraft·references·referenceDetails·referenceComparisons (`logs/net-profile-list-direct.txt`) | `PROFILE_PAGE` closure + 저장소 로더와 일치. 목록은 엔진(`profileEngine`)을 받지 않음 |
| 보드 "프로필 확정 (v1)" → `/profile/profile-1` 준비(h2 "전역 조정") | memoryBoardConfirm(조작) → profileEngine·effectiveProfile·profileContrast·adjustmentText | `PROFILE_AUTO`에서 이미 받은 공유 청크를 뺀 나머지와 일치. **memoryProfileAdjust 0건** (`logs/net-profile-entry.json`) |
| "조정 저장 (v2)" 클릭 직전 / 직후 | 0건 → memoryProfileAdjust 1건 | 스크립트 `/profile` afterAction 분류와 일치. 진입 때 `getAdjustmentRange` 자동 호출은 본문을 받지 않음(Q-B2-4) **확인** |

## 4. P-AC별 결과
구분: **[Q]** = 이번 브라우저 실측 · **[V]** = Vitest 703 통과를 근거로 함 · **[B]** = 빌드 · 범위 밖 = 2a-04c 이후

| AC | 판정 | 근거 |
|---|---|---|
| P-AC-08 (유지) | 통과 [Q] | `?v=1`: Callout "v1을 보고 있습니다 · 현재 v6" + 두 버튼, 포커스 H1. 4그룹이 그룹·옵션 모두 `aria-disabled`, 그룹 설명 "이전 버전은 바꿀 수 없습니다". 클릭해도 값 불변(입력 거부). "보정값 쓰기" `aria-disabled` + 같은 이유. `screens/07` |
| P-AC-12 | 통과 [Q] | radiogroup 이름 "밀도"·"대비"·"모션"·"사이트 목적"(AX), 보이는 글자가 값, 그룹당 tabIndex 0이 1개. Tab 정지 그룹당 1(`logs/keyboard-ax-profile-1280.json`) |
| P-AC-13 | 통과 [Q] | 좁은 범위 주입(`density:[comfortable]`, `motion:[L0,L1]`) 뒤 재마운트 결과는 아래와 같음. `screens/08` |
| | | 촘촘·L2가 `aria-disabled`, 그룹 설명 "촘촘: 이 테마에서 쓸 수 없음" · "L2 중간: 이 테마에서 쓸 수 없음 · 높음(L3)…" |
| | | 방향키가 비활성 옵션을 건너뜀(여유→Right = 여유, L1→Right = L0, End = L1) |
| | | Callout "지금 값 '촘촘'은 허용 범위 밖이라 저장할 수 없습니다 · **'여유'로 맞추기**"(r7 예문과 같음) + "'L1 낮음'으로 맞추기" |
| | | 저장 버튼 `aria-disabled` + 이유 "허용 범위 밖 값이 있어 저장할 수 없습니다 — '맞추기'로 바꾸세요" |
| | | 맞추기 → 포커스가 그 그룹 라디오로 가고, 저장 성공. 모션 L3 옵션 없음 + 캡션 |
| P-AC-14 | 통과 [Q] (3안 버튼 부분 범위 밖) | 4개 변경 → "저장하지 않은 조정 4개" + "조정 저장 (v2)" 활성 + "조정 취소". 취소 → 원래 값·캡션 없음, 포커스 = 저장 버튼. 보정 2개를 더하면 "6개". `screens/02` |
| P-AC-15 | 통과 [Q] | v2(origin adjust). "섹션 간격 72 · 조정됨 · 보드 값 96" · "L0 없음 · 조정됨 · 보드 값 L1". 알림 "v2로 저장했습니다". 버전 줄 "조정 · 간격 · 모션 외 4". `screens/04` |
| P-AC-16 | 통과 [Q] | 2.5초 지연 중: 버튼 "저장 중…" `aria-busy=true`. 클릭 1회 + 스크립트 클릭 5회를 했지만 저장소 호출은 **1회**. `screens/03` |
| | | 요청 실패 시 `role=alert` "저장하지 못했습니다 · 다시 시도하세요" + "다시 시도", 조정 유지, 버전 수 불변 → 복구 뒤 다시 시도 → v3. `screens/05` |
| | | 단 포커스 소실 → D-2A4B2-02 |
| P-AC-16 (응답 실패 멱등) | 통과 [Q] | 커밋 뒤 응답 실패 → 알림, store 버전 4 → 같은 인자로 다시 시도 → "v4로 저장했습니다", 버전 수 4 유지(+1만), "다른 곳에서" 문장 0 |
| P-AC-17 | 통과 [Q] | 초안(목적 문의) 상태에서 다른 탭을 흉내 내 `revertTo` → v5. 이어서 저장하면 `role=alert` "다른 곳에서 v5가 만들어졌습니다. 조정은 남겨 두었습니다 — 확인 후 다시 저장하세요", Tag "v5 · 현재", 버튼 "조정 저장 (v6)", 초안 1개 유지 → 다시 저장 → v6. `screens/06` |
| P-AC-18 | 통과 [Q] | ref-a "보정값 쓰기 (보조 글자 muted)"·"(대표색 primary)" → 저장 → 적용 팔레트 `#775033`·`#6A5544` + "조정됨 · 보드 값 #…", C-1·C-5 "통과". 쓴 뒤 버튼 "보정값을 썼습니다"(포커스 유지) |
| P-AC-19 | **실패 [Q]** (밝은 카드는 통과) | 밝은 카드 ref-a 강화: 목표 "7.0:1", 제안 primary `#775033`(−5.7%p) · muted `#6A5544`(−15.4%p) = 3.3 강화 열. 독립 재계산 C-1 7.048 · C-5 7.010(`logs/contrast-recompute-q3.txt`) |
| | | **어두운 카드 + primary `#8B5E3C`에서 강화 = 화면 붕괴 → D-2A4B2-01.** ref-d·ref-e 강화 열은 [V] |
| P-AC-06 / P-S15 | 통과 [Q] (AA) · 강화는 D-2A4B2-01 | 팔레트 A + 어두운 카드 AA: C-3 2.5 "미달", ink 충돌 문장 "본문 글자(ink)가 한 값으로 모든 배경의 기준을 맞출 수 없습니다…" + 후보 `#E7E7E7`(C-2 → 1.2 · C-4 → 1.0) + "비교 보드에서 팔레트 바꾸기", ink "보정값 쓰기" 없음, muted만 버튼. `screens/09` |
| | | ref-b 원 팔레트 충돌은 [V] |
| P-AC-20 | 부분 [Q] · 나머지 [V] | P-S13 화면은 위 P-AC-13으로 확인. 재확정 뒤 v3 `adjustments`는 읽지 않음 — 대비 "강화"가 이어졌다는 것은 오류 문구 "7:1"로 간접 확인(D-2A4B2-01). 목적·밀도·모션·보정 이어짐과 버전 요약 한 줄은 [V] |
| P-AC-32 | 통과 [Q] (1920 미측정) | 5폭 × `/profile/profile-1`·`/compare` 가로 넘침 0(`logs/responsive-*.json`, `screens/r-*.png`). 폭별 배치는 아래와 같음 |
| | | 1280: 2단(왼쪽 x=28 w=490에 값→팔레트→조정→버전, 오른쪽 x=550에 3안) |
| | | 1024: 1단 + 안 2열(값·팔레트 / 조정·버전) → 3안 |
| | | 768·390·320: 1열 |
| | | 목적 라디오는 320에서만 2줄로 줄바꿈. DOM 순서 = 보이는 순서(좌→우, 위→아래) |
| P-AC-33 | 통과 [Q] (포커스 소실 1건 제외) | Tab 순서는 5.2와 같음: 건너뛰기 → 헤더 7 → "비교 보드에서 선택 바꾸기" → 섹션 순서 summary → 출처 링크 → 라디오 4그룹(각 1) → "조정 저장 (v3)"(`aria-disabled` + "바꾼 조정이 없습니다") → 버전 버튼. `disabled` 속성 0 |
| P-AC-34 | [V] 가드 | 상태 글자는 모두 글자로 표시: "통과/미달"·"조정됨"·"이 테마에서 쓸 수 없음"·"저장하지 않은 조정 N개" |
| P-AC-35·36 | 통과 [B] | 1·2절 |
| P-AC-37 | 통과 [Q] | 저장 성공마다 `profile_saved{version, origin:"adjust"}` 1회, 실패마다 `profile_save_failed{reason}` 1회(UNKNOWN ×2 · STALE_PROFILE ×1). 재확정은 `board-reconfirm`. 키는 name·version·origin·reason뿐이고 hex·입력 원문 0 |
| Q2 이름표 | 통과 [Q] | CTA 위치 "히어로 좌측 하단"(캡션 `hero-inline`) · 카드 "보더 카드 · 모서리 큼 · 밝은 카드"(`bordered-lg`) · 이미지 비율 "가로형 16:9" · 모바일 "단일 컬럼 · 하단 CTA" |
| Q5 h2 | 통과 [Q] | h2 "프로필 값"·"역할 팔레트와 대비"·"전역 조정"·"버전"·"3안"(자리표시 + 안내 한 줄) |
| Q7 | 통과 [Q] | 조정 0(v1 직후) 1024 요약 바 "초안 1/10"(조정 글자 없음, `screens/14`) |
| | | 조정 3개(밀도·모션·muted 보정) 뒤 1024·768·390·320 바 "초안 1/10 · 조정 3개" = P-S25 캡션 "이 프로필에 조정 3개가 있습니다" |
| | | 1280은 하단 바 없음(패널 캡션만) |
| F2 (D-2A4-04) | 통과 [Q] | `?v=99` → Callout·알림 "요청한 v99가 없어 최신 v6을 보여 줍니다" → 앱 버튼 "보기 (v2)" → Callout 이전 버전으로 바뀌고 알림 "" |
| | | 뒤로(`?v=99`)는 다시 알림, 앞으로는 "" |
| | | 다른 알림 보존: `?v=1` 이동 때 "v6으로 저장했습니다" 유지 |
| | | 다만 없는 `?v=`에서 저장하면 저장 알림이 덮임 → D-2A4B2-03 |

## 5. 결함
| ID | 심각도 | 요약 | 재현 | 기대 | 실제 | 증거 |
|---|---|---|---|---|---|---|
| D-2A4B2-01 | **P1** | **대비 "강화" + 어두운 카드 + 중간 명도 primary → 보정 제안 계산이 throw해 `/profile/:id` 전체가 오류 경계로. 강화를 저장한 뒤 어두운 카드로 재확정하면 그 버전은 열 때마다 깨짐** | **A)** /catalog에서 모던 카페 브랜드·프리미엄 헤어살롱 비교 추가 → 보드 Hero A → "프로필 확정 (v1)" → 대비 "강화" → "조정 저장 (v2)" → "비교 보드에서 선택 바꾸기" → 카드 스타일 B(엘리베이티드 · 다크) → "새 버전으로 확정 (v3)" | v3 화면 표시. C-3(ink/primary)은 7.0이 불가능하므로 **P-S15 충돌 문장**(보정값 쓰기 없음 + 대체안)으로 표시 | 저장은 성공(이벤트 v3 `board-reconfirm`). 그 뒤 `/profile/profile-1`이 "화면을 불러오지 못했습니다 · 새로고침". console: `Error: 대비 7:1을 만들 수 없습니다: #2C2C2C / #8B5E3C`(`contrast.ts` `nearestCompliantColor` ← `profileContrast` 보정 제안 ← `profileEngine`) | `logs/crash-console.txt` · `screens/12`·`13` |
| | | | **경로 A는 QA 계측(Fetch 패치·메서드 감싸기)이 없는 새 문서(`goto /catalog`)에서 재현했다** — 도구 부작용이 아님 | | | |
| | | | **B)** 팔레트 A + 어두운 카드로 확정한 프로필(AA에서는 충돌 문장이 정상 표시)에서 대비 라디오 "강화" 클릭 (계측 있는 문서, 저장소 원래 메서드 복구 상태) | 같음 | 클릭 즉시 같은 오류 경계. 콘솔 스택은 이 경로에서 받지 못함 — 같은 기전(L2), 스택은 경로 A에서만 확인 | `screens/09`·`11` |
| | | | 원인(L1 코드 + 독립 계산): `nearestCompliantColor`는 명도 전 구간에서 목표를 못 찾으면 throw함(주석은 "흑·백 중 하나는 늘 4.5 이상" — 4.5만 전제). `#8B5E3C` 위 흰색 5.579 · 검정 3.764라 어떤 ink도 7.0 불가 | | | `logs/contrast-independent-crash.txt` |
| | | | 영향: 대비 목표 7.0은 b2가 연 경로라 b2 결함으로 봄. 유효한 보드 조합(Hero·팔레트 A + 카드 B)과 정상 조작만으로 도달함 | | | |
| | | | 영향: 복구 경로 없음. 오류 경계의 "새로고침"은 메모리 store(프로필·보드)를 지움. `?v=`로 이전 버전을 보는 것도 오류 화면에서는 불가(버튼 없음) | | | |
| | | | 영향: 같은 조건 후보 primary(L2 추정): ref-c `#1F5FBF`(흰 6.09 · 검 3.45). 밝은 카드에서도 surface가 중간 명도면 C-4에서 같은 throw가 날 수 있음(미측정) | | | |
| D-2A4B2-02 | P3 | 조정 저장 실패 뒤 "다시 시도"가 성공하면 포커스가 BODY로 사라짐 | 저장 실패(요청 실패 또는 커밋 뒤 응답 실패 주입) → `role=alert` "다시 시도" 버튼에 포커스(클릭) → 성공 | SPEC 5.2 "조정 저장 성공 → 이동 없음"이고, 누른 버튼이 사라지므로 포커스는 이어지는 요소(예: "조정 저장 (vN)" 버튼)에 남아야 함. 첫 저장 버튼 경로는 그렇게 동작함 | 성공 알림 뒤 `document.activeElement = BODY`(요청 실패·응답 실패 두 경로 모두). 키보드 사용자는 다음 Tab이 문서 처음부터 시작됨 | 본 REPORT 4절 P-AC-16 측정(A-RETRY·B-RETRY `focus` = body) |
| D-2A4B2-03 | P3 | 없는 `?v=`(예: `?v=abc`)를 보는 중 조정을 저장하면 "vN로 저장했습니다" 알림이 없는 버전 재알림으로 곧바로 덮임 | `?v=abc` → 목적 "판매" → "조정 저장 (v7)" | "프로필 알림"에 "v7로 저장했습니다"가 남음(5.3 저장 알림) | 알림 영역 최종 문장 = "요청한 버전이 없어 최신 v7을 보여 줍니다". 최신이 바뀌어 없는 버전 effect가 다시 알린 것(L2). 저장 완료 문장은 낭독되지 않았을 가능성이 큼(L2 — VoiceOver 불가). 화면 Tag "v7 · 현재"로는 알 수 있음 | 본 REPORT 4절 F2 측정("saved at abc") |

## 6. 알려짐 ID 재확인 (새 결함으로 올리지 않음)
| ID | 이번 상태 |
|---|---|
| D-2A4-01·02 (청크 실패 캐시, F1 보류) | 재측정 안 함. 이번 실패 주입은 청크 차단이 아니라 저장소 메서드 감싸기라서 이 기전과 무관. 조정 저장 본문(`loadProfileWrites`)도 같은 적용 범위라는 것은 b2 REPORT 12.2 기록대로 |
| D-2A4-03 (확정 버튼 재노출, 2a-04c) | 재측정 안 함(느린 네트워크 미주입) |
| D-2A4-04 (없는 `?v=` 알림) | **해소 확인**(F2, 4절). 인접 문제 1건은 D-2A4B2-03으로 따로 적음 |
| D-2A4-05 · A-03~05 (좁은 폭 버전 비교) | 이번 측정 범위 밖(NARROW 진행 중, main `8d81280`에 병합됨). `?diff=` 좁은 폭은 캡처하지 않음 |

## 7. 범위 밖 · 불가 · 관찰 (결함 아님)
- **VoiceOver: 불가.** 비대화형 세션이라 낭독을 들을 수 없습니다. AX 트리로 대신 확인했습니다: `status` "프로필 알림"(live polite), radiogroup 이름 4개, 모션 그룹 설명(L3 캡션), 실패는 `role=alert`.
- **Safari(WebKit): 불가.** 허용 도구가 ego-browser(Chromium)뿐이고 Playwright·WebKit 설치가 금지돼 있습니다.
- 1920 폭은 측정하지 않았습니다(브리프 목록 밖).
- 관찰 ①: 저장 실패·STALE 알림 중에도 "프로필 알림"에 직전 성공 문장("v2로 저장했습니다")이 남습니다. 다시 낭독되지는 않지만, 가상 커서로 읽으면 모순으로 들릴 수 있습니다.
- 관찰 ②: `app/src/features/profile/useProfileDetail.ts` 머리 주석 "저장소 쓰기 본문 청크가 /profile 진입 직후 합계에 든다(번들 스크립트 auto)"는 실제(3절, 조작 뒤)·r7 Q-B2-4와 반대입니다. 동작 영향은 없습니다.
- 관찰 ③: `/profile/*`에서 `document.title`이 "비교 보드 · Design Studio"로 남습니다(`CompareBoardPage`만 제목을 정하고 되돌리지 않음). b2 이전부터 있던 것이라 이번 범위 밖입니다. 라우트 제목 규칙은 별건으로 권고합니다(WCAG 2.4.2).
- 관찰 ④: P-S13 Callout 면이 `status-cautionary-bg`입니다. `Callout`에 cautionary 톤이 없어 warning 톤을 쓴 것으로, b2 REPORT 9절에 기록된 편차입니다. 초안에 보정을 쓰면 대비 검사 수치는 초안 기준이고 견본은 저장값 기준입니다(9절 결정).
- 관찰 ⑤: 라디오 그룹은 방향키로 옮기면 곧바로 값이 바뀝니다(APG radio 동작). P-S13 상태에서 방향키만으로도 범위 안 값으로 맞춰지고 Callout이 사라집니다.

## 8. 서버 종료 확인
- `vite preview --host 127.0.0.1 --port 4341 --strictPort`(pid 22563)를 종료했습니다. 이후 `lsof -nP -iTCP:4341 -sTCP:LISTEN`는 출력 없음, exit 1입니다(2026-09-27 00:09:21 KST, `logs/server-stop.txt`). ego-browser TaskSpace 27은 `finish({keep: []})`로 닫았습니다.

## 9. 산출물
- `logs/`
  - 게이트: typecheck·lint·test·build 로그
  - 청크 대조: `manifest-chunks.txt`·`net-profile-list-direct.txt`·`net-profile-entry.json`
  - 반응형·키보드: `responsive-profile.json`·`responsive-compare-q7.json`·`keyboard-ax-profile-1280.json`
  - 대비·결함: `crash-console.txt`·`contrast-independent-crash.txt`·`contrast-recompute-q3.txt`
  - 서버: `server-stop.txt`·`preview-server.log`
- `screens/`: 01~14(10은 화면 붕괴로 미촬영) 흐름·실패·STALE·P-S07·P-S13·충돌·붕괴·Q7, `r-{profile,compare}-{1280,1024,768,390,320}.png`
- `tools/`: `expose-studio.mjs`(0절) · `manifest-closure.mjs`(3절)
