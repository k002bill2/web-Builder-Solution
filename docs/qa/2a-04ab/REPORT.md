# QA-2A04AB REPORT — 2a-04a1·a2·b1 병합분 독립 검증

**판정: PASS with issues** — P1 0 · P2 1 · P3 4. 검증 4종 통과(test 666/666, 1회), 번들 전 시나리오 예산 안. 핵심 흐름(담기 → 셀 선택 → 확정 → `/profile` → 이전 버전 보기 → 되돌리기 → 재확정)과 P-S25 이어받기(캡션 즉시 · 펼칠 때 청크 1회 · 이어짐/지워짐 · 확정 뒤 "조정 M개를 지웠습니다" · Hero 해제 캡션 유지)는 실제 브라우저에서 SPEC r6대로 동작했습니다. 5폭+320 × 4화면 가로 넘침 0.
가장 무거운 결함은 **D-2A4-01(P2)**: 첫 확정 때 확정 본문 청크 로드가 한 번 실패하면, 네트워크가 돌아와도 "다시 시도"가 그 문서에서 영원히 실패합니다(Chromium이 실패한 동적 import를 URL 단위로 캐시). b1 REPORT 13.7·14.8 "알려진 위험"이 실제 브라우저에서 재현된 것입니다.

- 작성: Hermes QA · 2026-09-26 KST · 브리프 `docs/06-handoff/QA-2A04AB_QA_BRIEF.md` · 대상 HEAD `3c69917`(= main `23bd436` + 브리프)
- 기준: `docs/design/2a-04/SPEC.md` r6 (10.0·10.0.1·10.0.2 결정 표 포함). ADR-003 — 목업 px 비교 안 함.
- 환경: macOS · ego-browser(Chromium) · `vite preview` 127.0.0.1:4341(`dist` 프로덕션 빌드) · 원본 파일 속 문장은 데이터로만 취급.
- 근거 수준: 게이트·번들·브라우저 측정 = L1(로그·캡처) · 원인 추정 = L2(명시).

## 0. 계측 방법 공개 (제품 코드 무변경)
- 조정 UI(2a-04b2)가 아직 없어 실제 앱에서 "조정 있는 프로필"을 만들 경로가 없다. 그래서 **CDP Fetch로 `memoryStudio` 청크 응답만 가로채** `createMemoryStudio` 반환값을 `window.__qaStudio`에 노출하고 `profiles.saveAdjustments`를 직접 불렀다(`tools/expose-studio.mjs`). 제품 소스·`dist` 파일은 바꾸지 않았다.
- 이 직접 호출이 `memoryProfileAdjust`·`profileAdjustments` 청크를 미리 받는다. 따라서 "조정 있음" 진입 청크 대조는 **`carryOverPanel` 요청 0**에 한해서만 유효하다. 조정 없는 `/compare` 진입 청크 대조는 새 문서에서 따로 했다(3절).
- 메모리 저장소라 새로고침하면 store가 지워진다. 그래서 버전·URL 이동은 앱 링크/버튼 또는 `history.pushState + popstate`(라우터 입장에서 뒤로/앞으로와 같은 경로)로 했다.
- 청크 로드 실패는 `Network.setBlockedURLs`(대상 청크만 차단), 느린 네트워크는 `Network.emulateNetworkConditions`(latency 2000ms · 50KB/s, DevTools Slow 3G 상당) + 캐시 끔.

## 1. 기본 게이트 (1회, `logs/*.log`)
| 항목 | 결과 |
|---|---|
| typecheck | exit 0 (`logs/typecheck.log`) |
| lint | exit 0 (`logs/lint.log`) |
| test | **58 files · 666/666 통과, 1회** (`logs/test.log`). 시간 초과 실패 0 → 단독 재실행 불필요 |
| build | exit 0, 번들 스크립트 통과 (`logs/build.log`) |
| 제품 코드 변경 | `git diff --stat -- app design docs/design` 출력 없음(exit 0) |

## 2. 번들 (gzip KB, `logs/build.log` 스크립트 출력)
| 시나리오 | 첫 화면 / 예산 100 | 진입 직후 / 예산 125 | 조작 뒤(예산 밖) |
|---|---|---|---|
| /catalog | 99.02 | 101.40 | — |
| /references/:id | 96.37 | 98.75 | — |
| /compare | 99.48 | **124.43** (여유 0.57) | carryOverPanel +2.47 · memoryBoardConfirm +1.49 · profileAdjustments +1.35 · memoryProfileAdjust +3.12 |
| /compare (조정 있음) | 99.48 | 124.43 | 같음 |
| /profile | 99.18 | 118.79 | memoryProfileAdjust +2.39 |
| /studio (자리표시) | 89.46 | 91.84 | — |
- 공통 JS 89.02(index 85.74 + react 3.28). 모든 시나리오 첫 화면 ≤ 100 · 진입 직후 ≤ 125. b1 REPORT 15.4 최종값과 같다.
- Vite 표기 gzip: memoryBoardConfirm **1.49** · memoryProfileAdjust **1.77**(브리프의 1.76과 0.01 차 — 표기 반올림).

## 3. 청크 요청 대조 (P-B9 · Q-F4-1, 브라우저 `performance` resource)
기대 집합은 `dist/.vite/manifest.json`에서 스크립트와 같은 규칙(정적 closure)으로 계산했다(`logs/manifest-chunks.txt`).

| 시점 | 실제 요청(JS) | 스크립트 분류와 대조 |
|---|---|---|
| `/compare` 새 문서 직접 진입(빈 보드) | 18개: index·react·CompareBoardPage·Callout·compareTray·referenceDisplay·TextField·boardEngine·catalogFilters·contrast·memoryStudio·profileDraft·profileEvents·profileRepository·referenceComparisons·referenceDetails·references·sectionLibrary (`logs/net-compare-empty.txt`) | 공통+페이지+`COMPARE_AUTO` 집합과 **정확히 일치**. 조작 뒤 4청크 요청 0 |
| "프로필 확정" 클릭 | memoryBoardConfirm 요청 → 이동 | 조작 뒤(`COMPARE_AFTER_ACTION`) 분류와 일치 |
| 첫 확정 직후 `/profile` | ProfilePage·profileEngine·profileContrast·adjustmentText (+이미 받은 공유 청크) | `/profile` 자동 집합과 일치 |
| `/compare` 조정 있음 진입(캡션 표시) | 새 요청 0, **carryOverPanel 0** | 판정 청크 요청 0 (P-AC-39 ⑦) |
| "이어받기 확인" 펼침 | carryOverPanel **1회**(261ms 뒤 목록) | Q-F4-1 "조작 뒤" 분류와 일치 |
| Hero 해제 → 재선택(펼친 채) | 추가 요청 0 | FIX4 "받은 청크 재사용" 일치 |

## 4. P-AC별 결과
구분: **[Q]** = 이번 브라우저 실측 · **[V]** = Vitest 666 통과를 근거(브라우저로 볼 수 없거나 이번에 재현하지 않음) · **범위 밖** = 2a-04b2·c 몫.

| AC | 판정 | 근거 |
|---|---|---|
| P-AC-01 | 통과 [Q] | 확정 → `/profile/profile-1` h1 "디자인 프로필", Tag "v1 · 현재", 3.1 필드 전부(시각·레이아웃 방향, 7개 선택, 타이포·간격·모션, 섹션 9, 출처, 라이브러리·seed). `screens/01-profile-v1-1280.png` |
| P-AC-02·03·04 | 통과 [V] · 03 일부 [Q] | `/profile` 목록 4폭 표시·넘침 0 확인. 없는 id·회수 출처는 Vitest |
| P-AC-05 | 통과 [Q] | ref-a: C-1 5.5 · C-2 13.9 · C-4 11.6 · C-5 3.8 미달 · 대체안 `#8E715B`(4.5, −3.9%p) — 3.3 표와 같음. 밝은 카드라 C-3 줄 없음 |
| P-AC-06 | [V] | ref-b 충돌은 이번 브라우저에서 만들지 않음 |
| P-AC-07 | 통과 [Q] | 버전 줄: 번호·"현재" 글자·출처(보드 확정/재확정/되돌리기/조정)·요약·"방금". v1만일 때 "비교할 이전 버전이 없습니다" |
| P-AC-08 | 통과 [Q](조정 컨트롤 부분 범위 밖) | `?v=1` → Callout "v1을 보고 있습니다 · 현재 v2" + "현재 버전 보기"·"이 버전으로 되돌리기", 포커스 H1. 조정 컨트롤은 b2 몫이라 `aria-disabled` 확인 해당 없음 |
| P-AC-09 | 통과 [Q] | `?v=2&diff=1` → caption "v1과 v2 비교", 포커스 CAPTION, 모션·출처·생성 정보 줄 "바뀜" |
| P-AC-10 | 통과 [Q] | 되돌리기 → "v1 내용으로 v3을 만들었습니다"(status), 포커스 "v3 되돌리기 (v1)" 줄. 레코드 불변은 [V] |
| P-AC-11 | 통과 [Q] | 프로필 쪽 v3(되돌리기)·v4(조정) 뒤 보드 버튼 "새 버전으로 확정 (v5)", 결과 v5 |
| P-AC-12~19 | 범위 밖(b2) · 저장소 부분 [V] | 컨트롤 UI 미구현이 정상 |
| P-AC-20 | 통과 [Q] + [V] | v5 재확정: 밀도·모션 조정 이어받음(`adjustments` 유지). 값 목록이 적용값으로 바뀌는 표시는 b2 |
| P-AC-38 | 통과 [Q] | 캡션 "조정 2개" → 펼침 "이어지는 1개 · 지워지는 1개" + "밀도 촘촘 — 이어짐" / "모션 L0 — 지워짐 · 보드에서 모션을 바꿨습니다" → v6 요약 "…보드에서 모션을 바꿔 모션 조정을 지웠습니다", 프로필 알림 "조정 1개를 지웠습니다". `screens/10`·`11` |
| P-AC-39 ⑦ | 통과 [Q] | 캡션 N(2) = 이어짐 + 지워짐, 펼치기 전 요청 0, 실패 문구 "이어받기 목록을 불러오지 못했습니다" + "다시 시도", **실패 중 확정 가능**(저장 `adjustments` = `{density: compact}`, 알림 "조정 1개를 지웠습니다"). 단 "다시 시도"는 네트워크 회복 뒤에도 성공하지 않음 → D-2A4-02 |
| P-AC-39 ①~⑥ | [V] | ②(겹치지 않는 필드만 → 지워짐 0)는 [Q]로도 관찰: 모션 C(높음)는 초안에서 L2로 상한돼 "바뀐 필드" 아님 → "2개 · 0개" |
| P-AC-40~42 | [V] | 경쟁·원자성·멱등은 단위 테스트 근거. 멱등 재생은 D-2A4-03 재현 중 간접 관찰 |
| P-AC-21~31 | 범위 밖(2a-04c) | — |
| P-AC-32 | 통과 [Q](1920 미측정) | 1280·1024·768·390·**320** × `/compare`·`/profile/:id`·`?v=1&diff=3`·`/profile` 가로 넘침 0(`logs/responsive.json`, `screens/r-*.png`). `<1280` `/compare` 하단 "초안 요약" 바 있음. `/profile` 2단은 Q5에 따라 b·c 단계 |
| P-AC-33 | 통과 [Q] | `/profile?v=1` Tab: 건너뛰기 → 로고 → 메뉴 4 → 새 프로젝트 → 선택 바꾸기 → 현재 버전 보기 → 되돌리기 → 섹션 순서 → 출처 → 보기/비교 버튼들 = DOM 순서(5.2). 확정 불가 버튼 AX `disabled=true` + 보이는 이유("확정한 뒤 바뀐 내용이 없습니다") |
| P-AC-34 | [V] 가드 | 대비 재측정 안 함 |
| P-AC-35·36 | 통과 [B] | 2절·1절 |
| P-AC-37 | [V] | — |

## 5. 결함
| ID | 심각도 | 요약 | 재현 | 기대 | 실제 | 증거 |
|---|---|---|---|---|---|---|
| D-2A4-01 | **P2** | **첫 확정 때 확정 본문 청크(`memoryBoardConfirm`) 로드가 한 번 실패하면 "다시 시도"가 그 문서에서 영원히 실패** | 1) 새 문서 `/catalog`에서 2개 담기 → 보드 → Hero A 2) `memoryBoardConfirm` 요청 차단(일시 오프라인 상당) 3) "프로필 확정 (v1)" → 오류 4) 차단 해제 5) "다시 시도" 2회 | 네트워크 회복 뒤 다시 시도하면 확정 성공 | 매번 `alert` "확정하지 못했습니다. 선택은 저장돼 있습니다 · 다시 시도". resource 항목은 처음 1건(status 0)뿐 — 재시도가 **요청조차 보내지 않음**. 같은 URL을 페이지에서 직접 `import()`해도 거부, `?retry=1`을 붙이면 성공 → 원인은 네트워크가 아니라 **Chromium 모듈 맵의 실패 캐시**(L1 관찰 · 기전 L2). FIX3 이후 첫 확정도 이 청크가 필요하다. 앱 안 복구 경로 없음, 새로고침하면 메모리 store(보드 선택·프로필)가 지워짐. 일시 네트워크 실패가 전제라 정상 흐름 차단은 아니어서 P1이 아닌 P2로 둠. 되돌리기(`memoryProfileAdjust`, 같은 `writeBodyLoader` 구조)는 **같은 기전 추정 · 미측정** | `screens/18-compare-confirm-chunk-error-1280.png` · 본문 13.7·14.8 위험 |
| D-2A4-02 | P3 | P-S25 패널 청크(`carryOverPanel`) 로드 실패 뒤 "다시 시도"·Hero 재선택 자동 재요청(Q-F4-3)이 네트워크 회복 뒤에도 성공하지 않음 | 조정 있는 프로필로 보드 진입 → `carryOverPanel` 차단 → "이어받기 확인" → 오류 → 차단 해제 → "다시 시도" / Hero 해제·재선택 | 회복 뒤 목록 표시 | 계속 "이어받기 목록을 불러오지 못했습니다". 요청 재발생 0, 직접 import 거부 · `?retry=1` 성공(D-01과 같은 기전). 포커스는 summary 유지. 확정은 가능하고 저장값도 맞아 P3 | `screens/16`·`17-compare-ps25-*.png` |
| D-2A4-03 | P3 | **(Q4 답)** 확정 뒤 `/profile` 전환이 끝나기 전에는 이전 보드가 "확정 전"으로 남고, 그 사이 뒤로 가면 낡은 보드가 재마운트 전까지 고착 | A) Slow 3G에서 "프로필 확정 (v1)" → 버튼 "확정 중…"(aria-busy) 약 2.0초 → URL `/profile/profile-1`로 바뀐 뒤 t=2301~4451ms 동안 보드와 **busy가 풀린 "프로필 확정 (v1)"** 이 보이고 진행 표시 없음 → "불러오는 중…" → 표시 B) 같은 조건에서 URL이 `/profile`로 바뀐 직후 뒤로 | 전환 중에도 진행 표시 유지, 돌아온 보드는 "v1 확정됨 · 새 버전으로 확정 (v2)" | B에서 8초 넘게 "확정 전 · 프로필 확정 (v1)" 유지. 낡은 버튼을 누르면 멱등 재생으로 같은 v1로 이동, 버전 중복 없음(근거: 재마운트 뒤 버튼 "새 버전으로 확정 (v2)" + "확정한 뒤 바뀐 내용이 없습니다" — 간접). 오해 소지(확정 실패로 보임)만 있고 데이터는 안전 | `logs`(본 REPORT 수치) · `screens/12-slow3g-confirm-waiting-1280.png`·`14-q4-stale-board-after-back-1280.png`·`15-q4-stale-confirm-click-1280.png` |
| D-2A4-04 | P3 | 없는 `?v=` 안내가 유효한 버전으로 이동한 뒤에도 남음 | `?v=99`(또는 abc·0·01) → `?v=2&diff=1` / `?v=1` / 최신으로 이동(pushState+popstate) | 안내 사라짐 | `?v=2&diff=1`에서 Tag "v2 · 이전 버전"인데 Callout·프로필 알림은 "요청한 버전이 없어 최신 v3을 보여 줍니다"(모순). `?v=1`에서도 보이는 Callout 제목 1개와 sr-only 알림 문장이 남음. 도달 경로: 뒤로/앞으로. 앱 버튼("보기 (v1)") 클릭 경로는 미측정. 새로고침은 메모리 store 소실로 해당 없음 | 본 REPORT 수치 · `screens/04-profile-missing-v-1280.png` |
| D-2A4-05 | P3 | 좁은 폭 버전 비교 표의 "항목" 열이 29~43px로 줄어 글자 단위로 끊김 | `?v=1&diff=3`을 768·390·320에서 | 행 머리글이 한 줄 또는 단어 단위로 읽힘(보드 표처럼 가로 스크롤 + 머리글 고정 등) | 첫 열 폭 768 = 43px(2줄) · 390 = 32px · 320 = 29px, "시각 방향"·"CTA 위치"가 한 글자씩 세로(높이 101px). 표는 가로 스크롤하지 않고 줄어듦(래퍼 317/317). 가로 넘침은 0이라 P-AC-32와 별개 | `screens/r-profile-v1-diff-320.png`·`-390.png` |

## 6. 알려진 위험 판정 (사용성 영향만)
| 출처 | 위험 | 실측 | 판정 |
|---|---|---|---|
| b1 13.7·14.8 | 브라우저가 실패한 동적 import를 캐시 | **재현됨** — D-2A4-01·02 | P2(확정) · P3(패널) |
| b1 13.7 | 확정 알림이 history state라 뒤로 가기 시 재알림 | 재현 안 됨: 확정 직후 `history.state.usr = null`(비움), 보드로 뒤로 → 앞으로 뒤 알림 "" | 해소 확인 |
| b1 13.7 | 틀이 내려가면 로드 상태가 사라져 다시 요청 | 관찰: 펼친 채 Hero 해제·재선택은 재요청 0 | 영향 작음 |
| b1 14.8 | 첫 확정이 본문 청크를 기다림(느린 네트워크) | Slow 3G에서 확정 버튼 "확정 중…"·aria-busy 약 2.0초, 되돌리기 "되돌리는 중…"·aria-busy 약 2.1초 뒤 완료 알림. 대기 중 표시는 있음 | 영향 작음(전환 공백은 D-2A4-03) |
| v2-final · 트레이 | 필 목록이 Tab으로 닫히지 않음 | 390 `/catalog` 3개 담기 → 토글 Enter → Tab 4회로 목록 끝 → 다음 Tab에서 문서 처음(건너뛰기 링크)으로 가도 `aria-expanded=true` 유지, 목록이 화면 아래 약 130px(648~780)를 덮은 채 남음. Esc로 닫힘. 열린 목록이 본문 포커스를 가리는지는 측정 안 함 | P3 이하(영향 작음) — Esc·토글로 닫히고 트레이가 DOM 끝이라 Tab 흐름은 끊기지 않음 |
| v2-2a R-3 | 필터 개수 최대 8번 재조회 | 브라우저 측정 안 함. 메모리 구현이라 네트워크 요청 0 | 영향 작음(백엔드 연결 시 `facets()`로 재평가) |

## 7. 범위 밖 · 불가 · 관찰 (결함 아님)
- **VoiceOver 표본: 불가** — 비대화형 세션이라 낭독을 들을 수 없다. 대신 AX 트리로 확인: "프로필 알림"·"선택 알림" `status`(live polite), `details` 펼침 `expanded` false → true, 확정 불가 버튼 `disabled=true`.
- **Safari(WebKit): 불가** — 허용 도구가 ego-browser(Chromium)뿐이고 Playwright·WebKit 설치 금지. D-2A4-01·02의 실패 캐시가 WebKit·Firefox에서도 같은지는 미확인.
- 1920 폭 미측정(브리프 목록 밖).
- b2 인계 관찰: ① 조정 버전(v4) 요약이 "바뀐 값 없음" — 조정만 바뀐 버전의 요약 규칙 필요 ② 값 목록이 base 값(모션 L2·간격 96)이라 조정 반영 안 됨(REPORT b1 10절 "`effectiveProfile`로 값 목록 전환"과 같음) ③ 다른 쓰기(QA가 저장소 직접 호출 — 다른 탭 상당)로 v4가 생겨도 열린 `/profile`은 다시 읽기 전까지 v3 표시.
- 확정 직후 `/profile`로 이동하면 포커스가 BODY(앱 라우트 포커스 규칙 없음 — SPEC 5.2 L1, 메모리 "보류된 키보드 접근성" 항목과 같음).

## 8. 서버 종료 확인
- `vite preview --host 127.0.0.1 --port 4341 --strictPort`(pid 46200) 종료 후 `lsof -nP -iTCP:4341 -sTCP:LISTEN` → 출력 없음, exit 1 (2026-09-26 22:10:26 KST, `logs/server-stop.txt`). ego-browser TaskSpace 23 `finish({keep: []})`.

## 9. 산출물
- `logs/`: typecheck·lint·test·build 로그, `manifest-chunks.txt`, `net-compare-empty.txt`, `responsive.json`, `server-stop.txt`, `preview-server.log`
- `screens/`: 01~20 흐름·오류·Q4·트레이 캡처, `r-{compare,profile,profile-v1-diff}-{1280,1024,768,390,320}.png`
- `tools/expose-studio.mjs`: 0절 계측 스크립트
