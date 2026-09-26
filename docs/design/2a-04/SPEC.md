# DS-2A-04 설계서 — 디자인 프로필 · 3안 생성

- 작성: Designer · 2026-09-26 KST · 브리프 `docs/06-handoff/DS-2A-04_DESIGNER_BRIEF.md` · 근거 ADR-003·004·005·006, `docs/design/v2/SPEC.md` 6.5
- 변경 이력: r0 `d0e4699` 초안 · **r1** — 영환님 Q1~Q9 전부 A(Q4는 필드 단위 우선순위안), Codex adversarial 4건 반영 (브리프 `docs/06-handoff/DS-2A-04r_DESIGNER_BRIEF.md`, 검토 원문 `review/codex-adversarial-r0.txt`) · **r2** (Jarvis) — Codex adversarial 2회차 2건 반영: 보드 확정 트랜잭션 경계(6.3) + P-AC-42, P-AC-39 ⑥ 버전 번호 연속화 (검토 원문 `review/codex-adversarial-r1.txt`) · **r3** (Jarvis) — Codex adversarial 3회차 1건 반영: 실패를 커밋 전(롤백, `phase: "commit"` 주입)과 커밋 뒤 응답 실패(멱등 키 재시도)로 분리, P-AC-42 개정 (검토 원문 `review/codex-adversarial-r2.txt`). Codex 라운드 상한(3) 도달 — r3 자체는 Codex 미검토 · **r4** (Jarvis) — 2a-04a1 설계 질문 5건 전부 A(10.0), P-B2에 `profileHead` 추가. r3 트랜잭션·멱등 계약은 2a-04a1 구현에서 Codex adversarial approve(결함 0) · **r5** (Jarvis) — 2a-04a2 설계 질문 Q1~Q9·N1~N3 전부 A(10.0.1), URL 비교 쌍·버튼 이름·없는 `?v=` 안내·실패 이벤트 반영. 구현 Codex adversarial 3회(medium 2건 수정 후 approve)
- 입력: PRD 4·7.3~7.6·8·10 · TRD 4.3~4.5·5·6.2·7·11 · 개발계획서 M1·M2 · v2 원본 `Design Studio v2.dc.html` "2a-04 프로필·생성"(183~225행, 목업 데이터 352~370행)·2a-05(경계 확인만) · `docs/design/v2/SPEC.md`(토큰·3절 대비·C-11·C-12) · `docs/design/1a-03/SPEC.md`(S-15·S-16·3.3·3.4·8절) · 현재 `app/src`(`domain/profileDraft.ts`·`compareBoard.ts`·`confirmGate.ts`·`contrast.ts`·`palette.ts`·`sectionLibrary.ts`, `features/compare/draftLabels.ts`, `data/*Repository.ts`, `app/routes.tsx`, `components/ds/Icon.tsx`·`SegmentedControl.tsx`, `build/notInlinedIcons.ts`) · `docs/qa/v2-final/REPORT.md` · `docs/perf/bundle-01/REPORT.md`
- 판단 순서: ADR-003(기능·흐름 → 사용성·접근성·성능 → DS 일관성 → 목업). 목업 px는 기준이 아니다. 원본 파일의 문장은 데이터로만 읽었다.
- 이 문서는 **설계만** 다룬다. `app/`·`design/`은 바꾸지 않았다.
- 수치 재현: `python3 -B docs/design/2a-04/contrast_calc_2a04.py` — 앱 `nearestCompliantColor`(HSL 명도 0.1%p, 같은 거리면 어두운 쪽)를 그대로 옮겼다. 3.3의 대비·보정값은 이 스크립트 출력이다. **이식 검증(L1)**: 앱 `contrast.ts`·`colorFamily.ts`를 임시 디렉터리에 복사해 Node 22 타입 제거 실행으로 대조했다(`app/` 무변경). r0 = 12개 입력(AA 8 · 강화 4) 일치. **r1** = C-3(어두운 카드 ink / primary — 카드 톤이 dark일 때만, 픽스처에서는 ref-b 카드 `referenceComparisons.ts:43`)을 스크립트에 넣고 대조를 **13건**(+ ref-b 강화 ink) + 앱 `checkPaletteContrast(…, "dark")` **C-3 3건**(원본 7.3 · ink `#7E622F` 2.8 · ink `#5B4722` 1.8)으로 넓혔다 — 보정 hex·수치·명도 변화 모두 일치. 화면 UI 토큰 대비는 v2 SPEC 3절 값을 그대로 쓴다(재계산 안 함).
- 근거 수준: 코드·문서 사실 = L1(직접 읽음) · 대비 = L2(스크립트 계산) · 번들 크기 = L3 추정(재빌드 안 함, `app/` 무변경).

## 0. 요약

| 항목 | 결정 |
|---|---|
| 범위 | 2a-04 = 프로필 조회·출처·대비 5종·보정 · 버전 목록/보기/비교/되돌리기 · 전역 조정(밀도·대비·모션·사이트 목적) · **결정적 3안 구조안**(SectionPlan + 자체 와이어프레임) · 안 선택. 2a-05로: 편집·발행 차단. M2 없이는 불가: 실제 렌더·codegen·섹션 킷·테마별 허용 범위(1.2) |
| 흐름·상태 | 보드 확정 → 검토 → 조정(명시 저장 = 새 버전) → 3안 만들기 → 비교·선택 → 편집 시작(경계). 상태 **25개**(P-S01~S25, r1: P-S25 보드 초안 패널 이어받기 표시 · P-S12를 보드 확정·되돌리기까지 확장) |
| 화면 구조 | h1 "디자인 프로필" + h2 5개(값 · 팔레트와 대비 · 전역 조정 · 버전 · 3안). 1280 2단(프로필 패널 + 3안), 1024·768 1단 + 3열, 390 1열 |
| 3안 방식 | `composeCandidates` 순수 함수: Hero 변형 · 카드 그리드 · 제목 비율 **3축이 모든 쌍에서 다름**, 로그 3줄, lint 7규칙, 결과 해시. "구조 미리보기" 캡션. "다시 생성" 없음(결정성) — 재시도는 실패 때만. 잡 모양 인터페이스라 M2가 구현만 교체 |
| 데이터 계약 | `ProfileRepository`(목록·조회·범위·조정 저장·되돌리기) + `GenerationRepository`(요청 멱등·잡 조회·재시도·선택). 버전 = 보드 유래 `base` + 프로필 `adjustments`, **버전 번호 계열 하나**(프로필 쪽이 버전을 만들기 시작하면 생길 라벨 어긋남 예방 — 지금은 결함 아님, 6.1). 재확정은 **필드 단위 우선순위**(보드에서 바뀐 필드 = 보드 값 · 겹치는 조정 삭제 · 나머지 이어받음, 보드 패널과 저장소가 같은 함수). 버전을 만드는 모든 쓰기에 `expectedLatest` → 원자적 비교·생성, 불일치 `STALE_PROFILE`. 메모리 구현은 공유 저장 모듈 |
| 대비 | 검사 C-1~C-3(보드, C-3은 어두운 카드만) + C-4 ink/surface + C-5 muted/bg, 목표 4.5 / 강화 7.0. 픽스처 6개 중 5개에 AA 보정 제안, **ref-b는 역할 하나로 풀 수 없는 충돌**(ink 후보 `#7E622F` → C-3 7.3 → 2.8, Q9=A). 3.3 표 전부 스크립트 출력(C-3 포함) · 앱 TS 대조 일치. 화면 글자는 v2 토큰만, 프로필 색은 장식에만 |
| 번들 | 공통 변경 = `routes.tsx` lazy 교체 · 저장소 컨텍스트·deferred 래퍼(약 0.3~0.5KB, L3 — `/compare` 여유 1.49 안인지 첫 작업으로 실측) · `draftStatusOf` 한 줄 · 보드 래퍼 인자 1개씩. **보드 라우트 청크** += 이어받기 판정·P-S25 패널·`STALE_PROFILE` 처리(P-B9, L3 약 0.4~0.8KB). 메모리 구현은 동적 import, 아이콘 파일 추가 0, `import type` 필수. 목표(L3) 첫 화면 ≈ 97 / 진입 직후 ≈ 115KB. `/catalog`·`/compare`도 단계마다 재측정 |
| 단계 | **2a-04a** 조회·버전(넘치면 a1/a2) → **2a-04b** 조정·보정 → **2a-04c** 3안 → QA |
| 수용 기준 | **P-AC-01 ~ P-AC-42** (a 14 · b 11 · c 11 · 공통 6). r1 추가: P-AC-38·39(필드 단위 이어받기·패널 = 저장값) · P-AC-40·41(`expectedLatest` 경쟁·원자성). r2 추가: P-AC-42(보드 확정 트랜잭션) |
| 설계 결정 | **9개 모두 A**(2026-09-26 영환님) — Q1 구조안 · Q2 라디오 · Q3 4.5/7.0 · Q4 필드 단위 우선순위(Jarvis 수정안) · Q5 `adjustments.purpose` · Q6 버전 기준 생성 · Q7 편집 시작 → `/studio` · Q8 시드 없음 · Q9 충돌 표시·역할 분리 M2. 남은 쟁점 없음(10.1) |
| 목업 차이 | **18건**(11절 M-01~M-18) |

---

## 1. 범위

### 1.1 전제 (지금 저장소 상태, L1)
- 백엔드 없음. 데이터는 메모리 저장소 + fixtures. **영속 저장 없음**(`localStorage` 0건) → 새로고침·직접 URL 진입이면 프로필이 없다.
- 확정한 프로필은 `memoryCompareBoardRepository` 안의 배열(`profiles`)에만 있다. 화면에서 읽는 곳 0(`getProfileVersions`는 선언만 있고 사용처 없음).
- 섹션 라이브러리(`SECTION_LIBRARY` 1.4)는 **header 4 · hero 6 · footer 4 변형의 이름표**뿐이다. 본문 섹션 컴포넌트·composer·codegen·렌더러 없음(M2).
- `/profile`·`/profile/:profileId`는 자리표시(`PlaceholderPage`). 보드 확정 성공 시 `/profile/:id`로 이동한다(`useCompareBoard.ts:239`). GNB "새 프로젝트"는 `/profile`로 간다(`AppHeader.tsx:58`).

### 1.2 범위 표

| 요구 | 2a-04 (이번) | 2a-05 편집기로 넘김 | M2 생성기 없이는 불가 |
|---|---|---|---|
| FR-PRF-01 프로필 필드 | 전 필드 **읽기 표시**(3.1), 스키마 검증 통과분만 저장(zod, 저장소 경계) | — | — |
| FR-PRF-02 역할 팔레트·대비 | 대비 검사 5종 + **보정 제안·적용**(새 버전), 충돌 표시 | — | 무드별 토큰 값(M2 2.1) |
| FR-PRF-03 버전 | 목록·보기·비교(필드 차이)·되돌리기(새 버전), 이전 버전으로 **생성 재현**(같은 해시) | — | — |
| FR-PRF-04 전역 조정 | 밀도·대비·모션 + 사이트 목적, 허용 범위 밖 값 저장 불가 | — | **테마별** 허용 범위(M2 무드 × 밀도). 지금은 기본 범위 1벌 |
| FR-PRF-05 조직 안 복제(P1) | 제외 | — | 조직·권한(ORG) |
| FR-GEN-01 Profile → SectionPlan → 컴포넌트 → 미리보기 | **SectionPlan까지만**(구조안) | — | 컴포넌트·토큰 파일·실제 렌더(codegen·renderer) |
| FR-GEN-02 12유형 × 2변형 | 이름표로만 표시(구조안 썸네일 블록) | — | 섹션 킷 |
| FR-GEN-03 결정성 | 같은 입력 → 같은 구조안 **해시**, 표시·재현 검증 | — | 산출물(artifact) 해시 |
| FR-GEN-04 3안(축 2개 이상 다름) | Hero 변형 · 카드 그리드 · 제목 비율 3축, **3안 모두 서로 3축이 다름** | — | 실제 렌더 차이 |
| FR-GEN-05 로그 3줄 | 안마다 3줄 + 전체 로그 펼침 | — | codegen 단계 로그 |
| FR-GEN-06 lint | 구조 규칙 R-01·R-02·R-03·R-04·R-07·R-08·R-12 경고 표시 | 발행 차단(품질 게이트 FR-PUB-01) | R-05·R-09~R-11·R-13(콘텐츠·렌더 필요) |
| FR-GEN-07 LLM 카피(P2) | 제외 | — | — |
| FR-EDT-* | **경계만**: 안 선택 저장 + "편집 시작" 진입(Q7) | 전부 | — |
| 계측(PRD 9) | `profile_saved(version)` · `generation_requested/succeeded/failed(reason)` 호출 지점 정의(8절 AC) | `section_edited` 등 | — |

### 1.3 이번 프런트 단계의 최소 구현 범위 (Q1=A 반영)
1. **프로필 화면**: 조회 · 출처(회수 표시) · 역할 팔레트 대비 5종 · 버전 목록/보기/비교/되돌리기.
2. **전역 조정**: 밀도(2) · 대비(2) · 모션(L0~L2) · 사이트 목적 — 저장하면 새 버전.
3. **3안 구조안**: 결정적 순수 함수(`composeCandidates`)가 프로필 + 라이브러리 + seed로 SectionPlan 3개를 만든다. 썸네일은 **프로필 토큰으로 그린 자체 와이어프레임**이고, 화면에 "구조 미리보기 — 실제 페이지는 생성기 연결 후"를 적는다(Q1). 생성은 **잡 모양 인터페이스**(요청 → 상태 → 결과) 뒤에 둬서 M2가 구현만 바꾼다.
4. 제외: 실제 렌더·코드 생성·발행 차단·편집·조직 복제·LLM.

---

## 2. 사용자 흐름 · 상태

### 2.1 흐름

```
비교 보드 "프로필 확정 (v1)" ──▶ /profile/:profileId  (현재 = 최신 버전)
  │                                   │
  │                                   ├─ ① 프로필 검토: 값·출처·대비 결과 (읽기)
  │                                   ├─ ② 전역 조정·목적·대비 보정 (저장 안 된 조정) ──"조정 저장 (vN+1)"──▶ 새 버전
  │                                   ├─ ③ 버전: 보기(?v=) · 현재와 비교 · 되돌리기(새 버전)
  │                                   ├─ ④ "3안 만들기 (vN)" ──▶ 생성 중 ──▶ 3안 / 부분 실패 / 실패
  │                                   └─ ⑤ 안 비교 → "이 안 선택" ──▶ "B안으로 편집 시작" ──▶ /studio (2a-05 경계, Q7)
  └◀── "비교 보드에서 선택 바꾸기" (보드 재확정 = 같은 계열 새 버전 · 필드 단위 우선순위 6.1:
         보드에서 바뀐 필드는 보드 값, 겹치는 조정 삭제, 나머지 조정 이어받음 — 확정 전 보드 패널에 개수 표시 P-S25)
GNB "새 프로젝트" ──▶ /profile  (프로필 목록 · 없으면 시작 안내)
```

- 한 화면(`/profile/:profileId`)에 프로필과 3안을 함께 둔다(목업 구조와 같음). 3안은 **버전에 묶인다** — 보고 있는 버전의 생성 결과를 보여 준다.
- URL 상태: `?v=<n>`(보는 버전, 없으면 최신) · `&diff=<m>`(v와 m 비교 열림 — v가 없으면 최신과 m. m이 v와 같거나 없는 버전이면 닫힘, r5). 없는 `?v=`는 최신을 보이고 "요청한 v7이 없어 최신 v3을 보여 줍니다"(숫자 아니거나 0 이하·앞자리 0이면 "요청한 버전이 없어…")를 보이는 Callout(role 없음) + 상시 "프로필 알림" 영역으로 알린다. URL은 정규화하지 않는다(r5 N1~N3). 생성 잡·선택은 저장소가 정본이라 URL에 두지 않는다.
- 버전을 만드는 모든 쓰기(보드 확정·새 버전 · 조정 저장 · 되돌리기)는 호출자가 본 최신 버전(`expectedLatest`)을 함께 보낸다. 저장소가 비교·생성을 한 번에 하고, 다르면 거부한다(`STALE_PROFILE` → P-S12, 6.1-4).
- 생성은 **저장된 버전**에만 한다. 저장 안 된 조정이 있으면 생성 버튼 `aria-disabled` + 이유 "저장하지 않은 조정이 있습니다 — 저장하면 새 버전으로 만듭니다".

### 2.2 상태

| ID | 상태 | 표시 | 행동 |
|---|---|---|---|
| P-S01 | 로딩 | `LoadingState`(기존, 라우트 Suspense와 같은 문구). 제목 자리 고정(CLS) | — |
| P-S02 | 프로필 없음 | h1 "프로필을 찾을 수 없습니다" + "새로고침하면 확정한 프로필이 사라집니다(서버 연결 전)" + 버튼 "비교 보드로" · 링크 "카탈로그". **오류가 아니라 빈 상태**(`role=alert` 아님) | 보드로 |
| P-S03 | 불러오기 오류 | 기존 `RouteErrorBoundary`(저장소 예외 → `useThrowToBoundary`) | 다시 시도 |
| P-S04 | 목록(`/profile`) 비어 있음 | h1 "디자인 프로필" + "프로필은 비교 보드에서 요소를 골라 확정하면 만들어집니다" + "비교 보드로" · "카탈로그에서 고르기" | 보드로 |
| P-S05 | 목록 있음 | 프로필마다 한 줄: 기준 레퍼런스 제목 · 최신 버전 · 만든 시각 · 링크 "열기" | 열기 |
| P-S06 | 버전 1개뿐 | 버전 목록 한 줄 + "비교할 이전 버전이 없습니다". 비교·되돌리기 버튼 없음 | — |
| P-S07 | 이전 버전 보기(`?v=` < 최신) | 상단 `Callout tone=info` "v1을 보고 있습니다 · 현재 v3" + "현재 버전 보기" · "이 버전으로 되돌리기". 조정 컨트롤 `aria-disabled` + 이유 "이전 버전은 바꿀 수 없습니다" | 되돌리기 |
| P-S08 | 버전 비교(`&diff=`) | 필드 차이 표(3.5). 차이 없으면 "두 버전의 값이 같습니다" | 닫기 |
| P-S09 | 되돌리기 완료 | "v1 내용으로 v4를 만들었습니다"(`role=status`), 포커스 → 새 버전 행 | — |
| P-S10 | 저장 안 된 조정 | 조정 머리 캡션 "저장하지 않은 조정 N개" + "조정 저장 (v4)"(primary) · "조정 취소" | 저장 · 취소 |
| P-S11 | 조정 저장 중 / 저장됨 / 실패 | "저장 중…"(`aria-busy`, 중복 클릭 무시) → "v4로 저장했습니다"(`role=status`) → 실패 "저장하지 못했습니다 · 다시 시도"(`role=alert`, 조정 유지) | 다시 시도 |
| P-S12 | 다른 곳에서 새 버전 생김(`STALE_PROFILE`) — **버전을 만드는 모든 쓰기 공통**(r1) | 쓰기 거부(새 버전 0건) → 최신을 다시 읽어 버전 라벨 갱신, 사용자 입력 유지. **조정 저장**: "다른 곳에서 v4가 만들어졌습니다. 조정은 남겨 두었습니다 — 확인 후 다시 저장하세요"(버튼 "조정 저장 (v5)"). **되돌리기**: "다른 곳에서 v4가 만들어졌습니다. 되돌리지 않았습니다 — 확인 후 다시 되돌리세요"(보기 상태 유지). **보드 확정**(보드 화면): 버튼이 "새 버전으로 확정 (v4)"로 바뀌고 P-S25 개수 다시 계산 + "다른 곳에서 v3이 만들어졌습니다. 선택은 그대로입니다 — 확인 후 다시 확정하세요"(기존 `STALE_BOARD` 안내와 같은 자리·같은 알림 역할), 이동 없음 | 다시 저장 · 다시 확정 |
| P-S13 | 범위 밖 값 | 허용 범위 밖 옵션은 `aria-disabled` + 옆 캡션 "이 테마에서 쓸 수 없음". **이어받은 값이 범위 밖**이면 해당 그룹에 `Callout tone=cautionary` "지금 값 '촘촘'은 허용 범위 밖이라 저장할 수 없습니다 · '보통'으로 맞추기". 저장 버튼 `aria-disabled` + 이유 | 맞추기 |
| P-S14 | 대비 미달 · 보정 제안 | 3.3 표. 원인 · 수치 · 대체안 + "보정값 쓰기"(→ 저장 안 된 조정) | 보정값 쓰기 |
| P-S15 | 대비 보정 충돌 | 한 역할 값으로 모든 배경을 풀 수 없음 → "보정값 쓰기" 없음, 대체안 문장(3.3 ref-b) | 보드에서 카드 바꾸기 |
| P-S16 | 출처 회수됨 | 출처 목록 해당 줄 Tag "출처 회수됨"(글자) + "프로필 값은 우리 섹션·토큰이라 계속 쓸 수 있습니다". 링크 없음 (ADR-005 Q6) | — |
| P-S17 | 3안 없음 | "3안 만들기 (v3)"(primary) + 안내 "같은 버전으로 다시 만들면 같은 결과가 나옵니다" | 만들기 |
| P-S18 | 생성 중 | 버튼 `aria-busy` "만드는 중…", 카드 3칸 자리(고정 비율, CLS 0)에 "A안 만드는 중 · 1/3 완료" 글자. 알림 `role=status` "3안을 만드는 중입니다" → 진행 1/3·2/3 | — |
| P-S19 | 생성 성공 | 카드 3 + 비교 표. 알림 "3안을 만들었습니다". 포커스 이동 없음 | 선택 |
| P-S20 | 부분 실패 | 성공 카드 + 실패 칸 "C안을 만들지 못했습니다 · 원인 문장". 재시도 가능 오류(`JOB_TIMEOUT`·네트워크)만 "C안 다시 시도". 결정적 실패(`UNSUPPORTED_COMBINATION`)는 재시도 없음 + 바꿀 곳 안내. 알림 `role=alert` 1회 | 다시 시도 |
| P-S21 | 전체 실패 | `Callout tone=negative` 원인 문장 + (재시도 가능할 때만) "다시 시도". 알림 `role=alert` | 다시 시도 |
| P-S22 | 안 선택됨 | 선택 카드 "선택됨"(글자) + `aria-pressed=true`, 하단 "B안으로 편집 시작" 활성. 선택 전에는 `aria-disabled` + "안을 고르면 편집을 시작할 수 있습니다" | 편집 시작 |
| P-S23 | lint 경고 있음 | 카드 "경고 N" + 목록(규칙 · 원인 · 대체안). 선택은 막지 않는다(차단은 발행 단계, FR-GEN-06) | — |
| P-S24 | 긴 값 | 레퍼런스 제목·로그·섹션 이름 자르지 않고 줄바꿈(`keep-all` + `overflow-wrap:anywhere`, 기존 규칙). 카드 제목은 "A안" 고정이라 해당 없음 | — |
| P-S25 | **보드 초안 패널 — 이어받을 조정**(보드 화면, r1 · Q4=A) | 확정한 프로필이 있고 최신 버전에 조정이 1개 이상일 때만 확정 버튼 위에 캡션 "이어지는 조정 N개 · 지워지는 조정 M개"(글자, 색 하나로 알리지 않음) + `details` "조정 목록": 줄마다 "밀도 촘촘 — 이어짐" / "모션 L2 — 지워짐 · 보드에서 모션을 바꿨습니다"(이유 문장 6.1 표). 조정 0개면 캡션 없음. **확정하면 이 목록 그대로 저장된다**(같은 함수 `carryOverAdjustments`, 6.1-3) | 확정 |

상태 **25개**(P-S01~P-S25). 1a-03 S-12(자동 저장)와 달리 조정은 **명시 저장**이다 — 저장마다 버전이 생기므로(FR-PRF-03) 자동 저장이면 버전이 조작 수만큼 쌓인다.
- 이동 차단(저장 안 한 조정을 두고 나가기)은 두지 않는다. 선언형 라우터라 `useBlocker`(data router 전용)를 쓸 수 없고, data router는 번들 때문에 기각됐다(`routes.tsx` 주석). 조정은 4개 컨트롤이라 잃어도 다시 고르기 쉽다. 잃는 조정 수는 P-S10 캡션으로 늘 보인다.

---

## 3. 프로필 화면 구조

### 3.1 영역과 필드 (FR-PRF-01)

제목 구조: h1 **"디자인 프로필"** + 버전 Tag("v3 · 현재" / "v1 · 이전 버전") · 부제 "기준 레퍼런스: 카페 온도 · 스타일 조합". h2: 프로필 값 · 역할 팔레트와 대비 · 전역 조정 · 버전 · 3안.

| 영역 (h2) | 보여 줄 것 (DesignProfile 필드) | 표시 방식 |
|---|---|---|
| 프로필 값 | `visual_direction`·`layout_direction` | **비대화형 Tag**(v2 C-11 선례 — 목업의 활성 FilterChip은 누를 수 있어 보인다). 바꾸려면 보드("비교 보드에서 선택 바꾸기") |
| | `component_choices` — Hero · 메뉴(header) · CTA 위치 · 카드 스타일(밝은/어두운) · 이미지 비율 · 모바일 구조 · Footer | 라벨 + 값 목록(`dl`). 값은 라이브러리 이름표(`SECTION_LIBRARY` label) — 변형 키(`fullbleed-left`)는 캡션으로 |
| | `typography_tokens` | "Pretendard · 제목 700 / 본문 400 · 비율 1.25" |
| | `spacing_tokens` + 밀도 | "그리드 8pt · 섹션 간격 96" + 밀도 조정 반영값 |
| | `motion_preset` | "L1 낮음"(조정 반영) |
| | `section_plan` | "섹션 9" + 순서 목록(유형 · 변형 이름) — 펼침(`details`) 기본 접힘 |
| | `source_reference_ids` | 출처 목록: 제목(링크 `/references/:id`) · 업종 · 라이선스 Tag. **썸네일·외부 URL 없음**(PRD 4, TR-POL-01). 회수 = P-S16 |
| | `library_version`·`seed`·`selection_mode` | 캡션 한 줄 "라이브러리 1.4 · seed 1a2b3c4d · 스타일 조합" |
| 역할 팔레트와 대비 | `color_tokens` 5역할 | 3.3 |
| 전역 조정 | 밀도 · 대비 · 모션 · 사이트 목적 | 3.4 |
| 버전 | 계열의 모든 버전 | 3.5 |

- 값은 보고 있는 버전의 **적용된 값**(보드 유래 값 + 조정, 6.3 `effectiveProfile`)이다. 조정으로 바뀐 값에는 캡션 "조정됨 · 보드 값 L2".

### 3.2 출처 레퍼런스 (권리 경계)
- 제목·업종·라이선스만 보인다. 레퍼런스 이미지·캡처·외부 URL은 없다. 프로필이 담는 것은 우리 섹션 변형·토큰이라는 문장을 출처 목록 아래 캡션으로 한 번 둔다("출처 레퍼런스의 이미지·문구는 쓰지 않습니다").
- 회수·비노출 판정: `ReferenceRepository.getById`가 `undefined`(비노출 포함) → "출처 회수됨". 목록에서 지우지 않는다(이력).

### 3.3 역할 팔레트 · 대비 (FR-PRF-02)

**표시**: 역할 5개(primary · surface · ink · muted · bg) 견본 + 역할 이름 + hex 글자. 견본에는 `line-normal` 테두리(흰 bg 견본이 흰 면에서 사라지지 않게). 견본은 `aria-hidden`, 정보는 글자.

**검사 5종**(순수 함수 `checkProfileContrast` — 보드의 `checkPaletteContrast` C-1~C-3을 확장, 같은 `contrast.ts`):

| ID | 검사 | 보정 대상 역할 | 출처 |
|---|---|---|---|
| C-1 | 흰 글자 / primary (버튼·CTA) | primary | 보드 3.4 그대로 |
| C-2 | ink / bg (본문) | ink | 보드 3.4 그대로 |
| C-3 | 어두운 카드일 때 ink / primary — 카드 톤(`card_style.surfaceTone`)이 `dark`일 때만 검사 | ink | 보드 3.4 그대로(`checkPaletteContrast`) |
| **C-4** | ink / surface (교차 배경·카드 본문) | ink | 신규 — 목업 "섹션 리듬 · 교차 배경" |
| **C-5** | muted / bg (보조 글자) | muted | 신규 — 목업 "보조 텍스트 대비 … 보정 제안" |

- 목표: 대비 조정 **AA = 4.5**, **강화 = 7.0**(Q3). 5종 모두 같은 목표를 쓴다 — C-1(버튼 글자)도 강화면 7.0(3.3 표 강화 열 ref-a `#775033`).
- 보정 방법: `nearestCompliantColor(역할 값, 그 역할이 놓이는 배경 중 **가장 대비가 낮은 배경**, 목표)` — 한 역할에 검사가 여럿(ink = C-2·C-4)이면 최저 배경 기준으로 한 번. 적용 전 **모든 검사를 다시 계산**해 다른 검사가 새로 미달하면 **충돌**(P-S15).
- 문구 형식(1a-03 3.4 이어받음): 원인 · 수치 · 대체안 + 보정 전·후 견본. 예: "보조 글자(muted) 대비가 흰 배경에서 3.8:1로 기준 4.5:1보다 낮습니다. 대체안: #8E715B(4.5:1, 명도 −3.9%p)" + "보정값 쓰기". 수치는 `formatRatio`(버림).
- 보정값 쓰기 = 저장 안 된 조정에 `corrections` 항목 추가(P-S10) → "조정 저장"으로 새 버전.
- 보드에서 남은 R-08 경고(C-1~C-3)는 같은 함수라 여기서 **다시 보인다**(1a-03 3.3 R-08 이관 이행).

**픽스처 실측**(r1: 스크립트 "역할별 보정" 출력 그대로, 기준 레퍼런스 팔레트 + 같은 레퍼런스 카드일 때). 보정은 역할마다 한 번(최저 대비 검사 기준) → 모든 검사 재계산 → 보정 없이 통과하던 검사가 미달이면 **충돌**. 강화 열은 목표 7.0으로 **모든 역할을 다시 계산한 값**이다(AA 보정값에 더하는 것이 아님).

| 팔레트 | 카드 | 검사 원값 (4.5 미달 굵게) | AA(4.5) 보정 제안 | 강화(7.0) 보정 제안 |
|---|---|---|---|---|
| ref-a 카페 | 밝음 | C-1 5.5 · C-2 13.9 · C-4 11.6 · **C-5 3.8** | muted → `#8E715B`(C-5 4.5, 명도 −3.9%p) | primary → `#775033`(C-1 7.0) · muted → `#6A5544` |
| ref-b | **어두움** | C-1 16.4 · **C-2 2.2** · C-3 7.3 · **C-4 1.7** · **C-5 3.7** | ink **충돌**: 후보 `#7E622F`(C-4 기준 4.5 · C-2 5.7)를 쓰면 **C-3 7.3 → 2.8** → 보정값 쓰기 없음 · muted → `#7B766E`(C-5 4.5) | ink **충돌**: 후보 `#5B4722` → C-3 7.3 → 1.8 · muted → `#5D5853` |
| ref-c | 밝음 | C-1 6.0 · C-2 13.9 · C-4 12.3 · **C-5 3.3** | muted → `#4F76BD` | primary → `#1C56AE`(C-1 6.0 → 7.0) · muted → `#385893` |
| ref-d | 밝음 | **C-1 3.0** · C-2 18.8 · C-4 17.9 · **C-5 1.8** | primary → `#00866A` · muted → `#28846E` | primary → `#006550` · muted → `#1E6353` |
| ref-e | 밝음 | C-1 17.0 · C-2 5.8 · C-4 5.4 · C-5 4.7 | 없음 | ink → `#4C22F0`(C-4 기준, C-2·C-4) · muted → `#565960` |
| ref-f | 밝음 | **C-1 3.2** · C-2 13.3 · C-4 12.1 · **C-5 3.0** | primary → `#AF6300` · muted → `#996E41` | primary → `#844B00` · muted → `#735231` |

- **ref-b 충돌**(P-S15): 금색 ink `#C9A96E`는 어두운 카드 위에서 7.3이지만 흰 배경 본문에서 2.2다. 역할 하나(ink)가 밝은 면과 어두운 면에 모두 놓여 **어떤 한 값도 둘 다 4.5를 넘지 못한다**(어둡게 하면 C-3 2.8). 문구: "본문 글자(ink)가 흰 배경(2.2:1)과 어두운 카드(7.3:1)에 함께 쓰여 한 값으로 둘 다 맞출 수 없습니다. 대체안: 비교 보드에서 밝은 카드를 고르면 ink를 어둡게 보정할 수 있습니다" + 링크 "비교 보드에서 카드 바꾸기". 역할 분리(어두운 면 전용 글자 역할)는 M2 토큰 작업 몫 — Q9=A. 강화(7.0)에서도 충돌은 그대로다(후보 `#5B4722` → C-3 1.8).

### 3.4 전역 조정 (FR-PRF-04)

| 조정 | 값 (저장 키) | 효과 | 기본 허용 범위 |
|---|---|---|---|
| 밀도 | 여유(`comfortable`) · 촘촘(`compact`) | `spacing_tokens.sectionGap`: 여유 = 보드 값, 촘촘 = 보드 값 × 0.75를 8의 배수로 내림(96 → 72) | 둘 다 |
| 대비 | 기본 AA(`aa`) · 강화(`enhanced`) | 3.3 검사 목표 4.5 / 7.0 · lint R-08 목표 | 둘 다. **AA 미만은 옵션 자체가 없다**(범위 밖) |
| 모션 | 없음 L0 · 낮음 L1 · 중간 L2 | `motion_preset` 대체(보드에서 모션을 바꿔 재확정하면 이 조정은 지워진다 — 6.1 표) | L0~L2 (L3는 생성 상한 밖 — 옵션 없음, 캡션 "높음(L3)은 생성 상한 밖이라 고를 수 없습니다") |
| 사이트 목적 | 예약 · 문의 · 판매 · 정하지 않음 | lint R-03·R-04 · 구조안 필수 섹션(4.2) (ADR-005 Q2 이행) | 전부 |

- **컨트롤 = 라디오 그룹**(기존 `SegmentedControl`, roving · 방향키 · Home/End, 보이는 글자가 곧 값). 목업의 슬라이더는 값이 2~3단계뿐이라 끌기 조작이 이점이 없고, 현재 값이 글자로 보이지 않는다. 네이티브 `input type=range` + `aria-valuetext`도 새 의존성 없이 가능하지만, 범위 밖 구간을 막을 때 "왜 못 가는지"를 알릴 곳이 없다 → Q2=A(라디오 그룹).
- `SegmentedControl` 확장 1개: 옵션별 `disabled` + 보이는 이유 캡션. 비활성 옵션은 roving에서 건너뛰므로(APG radio group) 포커스를 받지 않는다 → **이유는 라디오 그룹의 설명**(`aria-describedby` → 그룹 아래 캡션 "촘촘: 이 테마에서 쓸 수 없음")에 둔다. 그룹에 들어가면 이유를 듣는다. 목적은 4개라 `Select`(기존)도 가능하지만 한 벌 규칙(같은 모양 = 같은 조작)으로 라디오 그룹.
- 범위는 저장소가 준다(`getAdjustmentRange`, 6.3). 지금은 기본 범위 1벌(모든 옵션 허용)이라 **P-S13은 기본 범위에서 생기지 않는다** — 메모리 구현이 `range` 옵션을 주입받아 좁은 범위로 테스트한다. M2에서 무드별로 바뀌어도 화면은 그대로다.
- 저장 경계에서 zod로 다시 검사: 범위 밖이면 `RANGE_VIOLATION`(화면은 이미 막지만 서버가 정본).

### 3.5 버전 (FR-PRF-03)

한 줄 = 버전 번호(글자) · 현재/보는 중 Tag(글자, 색만으로 알리지 않음) · 출처(보드 확정 / 보드 재확정 / 조정 / 대비 보정 / 되돌리기) · 요약(직전 버전과의 차이 최대 2개 + "외 N") · 시각(`<time datetime>`, 상대 표기 "12분 전"). 버튼: "보기"(보고 있는 버전이면 없음) · "현재와 비교"(현재 버전 줄에는 없음). 되돌리기는 보기 상태(P-S07)에서만.

- **비교**: 두 버전의 적용된 값 필드별 표(`table`, caption "v1과 v3 비교"). 열 = 항목 · v1 · v3 · 차이. 바뀐 줄 차이 칸 "바뀜"(글자) + 굵게. 팔레트는 역할별 hex 글자 + 견본. 같으면 P-S08 빈 문장. 순수 함수 `diffProfiles(a, b)` — 표시 순서는 3.1 표 순서로 고정.
- **되돌리기**: 과거 버전 레코드는 바꾸지 않는다. 대상 버전의 보드 유래 값 + 조정을 복사해 **새 버전**(`origin: revert`, `basedOn: 1`)을 만든다. 되돌린 뒤에는 새 버전이 현재다.
- **생성 재현**: 이전 버전을 보는 중에도 "3안 만들기 (v1)"가 된다. 같은 버전·같은 라이브러리·같은 생성기 버전이면 결과 해시가 처음과 같다(P-AC 결정성).
- 긴 이력: 기본 최근 5개 + "이전 버전 N개 더 보기"(펼침, 페이지 이동 없음).

---

## 4. 3안 생성 · 비교

### 4.1 방식 (Q1=A)

생성기(M2)가 없으므로 **결정적 구조안**을 만든다. 가짜 페이지를 그리지 않는다.

- 순수 함수 `composeCandidates(profile, purpose, library, generatorVersion) → CandidatePlan[3]`. 입력이 같으면 출력·해시가 같다. 무작위·시각·순서 의존 없음.
- **라이브러리는 프로필에 고정된 `library_version`의 것**을 쓴다(현재 공개 버전이 아님). 저장소가 버전별 라이브러리를 찾지 못하면 3안 모두 결정적 실패(`UNSUPPORTED_COMBINATION`, "라이브러리 1.4를 찾을 수 없습니다", 재시도 없음). 그래야 M2가 1.5를 내도 "이전 버전으로 생성 재현"(FR-PRF-03)이 유지된다. 지금 메모리 구현은 `SECTION_LIBRARY` 1벌이므로 `libraries` 옵션(버전 → 라이브러리)으로 받는다.
- 결과는 **SectionPlan + 축 값 + 모션 배정 + 로그 + lint**다. 썸네일은 이 SectionPlan을 **프로필 역할 팔레트로 칠한 자체 와이어프레임**(블록·막대, 글자 없음, `aria-hidden`)이다. 색은 데이터(프로필 토큰)에서 CSS 변수로 넘긴다 — 컴포넌트에 hex 없음(`noHardcodedStyle`).
- 3안 영역 머리에 늘 보이는 캡션: **"구조 미리보기 — 섹션 구성·비율·모션 배정입니다. 실제 페이지는 생성기 연결 후(M2) 만들어집니다."**
- 저장소는 **잡 모양**(`requestGeneration` → `getJob` 상태 → 결과)으로 둔다. M2에서 서버 생성기로 바꿀 때 화면·타입은 그대로이고, 결과에 미리보기 URL·artifact 해시 필드만 더한다.
- 기각한 대안: 고정 fixtures 3안(입력과 무관 — 조정·버전을 바꿔도 같은 그림이라 FR-GEN-03·04를 흉내만 낸다). 3안 영역을 M2까지 비우기(Q1 대안 B — 흐름을 끝까지 검증할 수 없다).

### 4.2 차이 축과 규칙 (FR-GEN-04)

| 축 | 값 사다리 | A안 | B안 · C안 |
|---|---|---|---|
| Hero 변형 | 라이브러리 hero 변형(1.4: 6개) | 프로필의 Hero | A를 뺀 변형을 키 사전순으로 놓고 `seed`로 시작 위치를 정해 연속 2개 |
| 카드 그리드 | 3열 · 2열 · 마소니 | 프로필 section_plan의 첫 services/portfolio 변형에서(`grid-3` → 3열, `grid-2` → 2열, `masonry` → 마소니, 없으면 3열) | 나머지 2개. `seed` 홀짝으로 B·C 순서 |
| 제목 비율(타입 스케일) | 1.2 · 1.25 · 1.333 | 프로필 `scale`(사다리 밖 값이면 그대로, 표시 "1.28 (프로필)") | 사다리에서 A와 다른 2개, 가까운 순 |

- 세 축 모두 3안이 서로 다른 값을 갖는다 → **어느 두 안도 3축이 다름**(수용 기준 "2개 이상"보다 강함).
- 공통 규칙(모든 안): 목적 `booking` → contact(예약) 없으면 footer 앞에 추가(R-04) · `inquiry` → 후반 1/3에 cta-band·contact 없으면 footer 앞에 cta-band 추가(R-03) · 본문 9개 초과 → 고정 우선순위 끝에서 제외(R-01, 로그 "제외 후보") · Footer 사업자정보 없음 → 확장 변형(R-12, 보드 확정과 같은 규칙) · 모션: preset이 L2면 hero + 앞 본문 2개만 L2, 나머지 L1(R-07 "L2 ≤ 3", 1a-03 3.3에서 넘겨받은 배정).
- 본문 5개 미만(R-01)은 지어낼 수 없어 **경고**로만 남긴다.
- 결정적 실패: 라이브러리 hero 변형이 3개 미만이면 C안(또는 B안)은 `UNSUPPORTED_COMBINATION` — P-S20의 자연 발생 경로. 재시도 없음.

### 4.3 로그 3줄 (FR-GEN-05)
안마다 항상 보이는 3줄(규칙에서 만든 문장, 자유 문장 아님):
1. **적용 규칙** — 예: "목적 '예약' → Contact(예약) 추가 (R-04)" / 없으면 "구조 규칙 모두 충족"
2. **축 변경** — 예: "Hero 스플릿 · 카드 2열 · 비율 1.2 (A와 3축 다름)" / A안: "프로필 값 그대로"
3. **제외 후보와 이유** — 예: "Pricing 제외 — 본문 9개 상한 (R-01)" / 없으면 "제외한 섹션 없음"

"전체 로그"(`details`)에 단계별 항목(입력 요약 · 규칙별 판정 · 모션 배정 · 해시)을 모두 둔다.

### 4.4 lint 경고 (FR-GEN-06)
| 규칙 | 2a-04 판정 | 표시 |
|---|---|---|
| R-01·R-02 | 구조안에서 계산 | 위반 시 "경고" |
| R-03·R-04 | 목적이 정해졌을 때만. 구조안이 자동으로 채우므로 보통 로그 1줄로만 나온다 | 목적 "정하지 않음"이면 정보 한 줄 "목적을 고르면 필수 섹션을 검사합니다" |
| R-07 | 모션 배정 결과 검사 | 위반 시 경고(배정 규칙상 0이어야 함 — 회귀 방지) |
| R-08 | 3.3 검사(대비 조정 목표) 미달 남음 | "대비 미달 N — 프로필에서 보정" 링크(같은 화면 h2 앵커) |
| R-12 | 확장 변형으로 바꿨으면 로그, 못 바꾸면 경고 | |
- 문구 형식: 규칙 ID · 원인 · 대체안. 선택은 막지 않는다. 카드 머리 "경고 2"는 글자 + `warning` 아이콘(파일 아이콘, 장식).

### 4.5 결정성 표시 (FR-GEN-03)
- 3안 머리 캡션: "프로필 v3 · 라이브러리 1.4 · seed 1a2b3c4d · 생성기 preview-1 → 같은 입력이면 같은 결과". 카드마다 "결과 해시 3f9a1c07"(8자리, 기존 `ds-mono` 클래스).
- **"다시 생성" 버튼 없음.** 같은 입력이면 같은 결과라 누를 이유가 없고(TRD 6.2: 재시도는 인프라 오류만), 결과가 바뀌지 않는 버튼은 거짓 행동 유도다. 새 결과는 조정 저장(새 버전) → "3안 만들기 (v4)"로만 생긴다. 이미 만든 버전은 저장된 결과를 바로 보여 준다(요청 멱등).

### 4.6 카드와 비교
- 카드(3개, `ul`/`li`, 제목 h3 "A안"): 썸네일(4:5, 고정 비율) · 축 3개 캡션 · 로그 3줄 · 경고 N(있을 때) · 해시 · 버튼 "이 안 선택"(`aria-pressed`, 접근 이름 "A안 선택") · "섹션 순서 보기"(`details`).
- 선택 표시: 카드 둘레 주 색 테두리(UI 3:1, primary 흰 면 4.95) **+ 버튼 글자 "선택됨" + Tag "선택"** — 색 외 단서 2개(C-12 원칙).
- 비교 표(≥768, `table` caption "3안 비교"): 행 = Hero · 카드 그리드 · 제목 비율 · 섹션 수 · 모션 L2 섹션 · 경고 · 해시, 열 = A·B·C. A와 다른 값 칸에 캡션 "A와 다름". <768은 표 없이 카드가 같은 정보를 모두 가진다(정보 손실 없음).
- 선택은 저장소에 저장(`selectCandidate`) → 다시 들어와도 유지. 다른 버전의 3안을 보면 그 버전의 선택을 보여 준다.
- 하단 행동: "B안으로 편집 시작"(primary, 선택 따라 이름이 바뀜) — 2a-05 경계(Q7).

---

## 5. 반응형 · 접근성 · 대비

### 5.1 5폭

비교 보드와 같은 경계(≥1280 / 768~1279 / <768)와 본문 상한(`--layout-max-width` 1280)을 쓴다.

| 폭 | 배치 | 3안 |
|---|---|---|
| 1920 | 본문 1280 가운데. 1280과 같음 | — |
| 1280 | **2단**: 왼쪽 프로필 패널(프로필 값 · 팔레트 · 조정 · 버전, 목업 aside) + 오른쪽 3안 | 3열 + 비교 표 |
| 1024 | **1단**: 프로필 영역(안에서 2열 — 값·팔레트 / 조정·버전) → 3안 | 3열(카드 약 300) + 비교 표 |
| 768 | 1단, 프로필 영역 1열 | 3열(카드 약 220, 캡션 줄바꿈) + 비교 표(가로 스크롤, 행 머리글 고정 — 보드 표 규칙) |
| 390 | 1단 | 1열 카드, 비교 표 없음. 조정 라디오 그룹은 한 줄에 안 들어가면 줄바꿈(가로 넘침 0) |

- DOM 순서 = 보이는 순서 = 흐름 순서(검토 → 조정 → 버전 → 3안). 2단에서도 왼쪽 패널이 먼저.
- 하단 고정 바는 두지 않는다(보드 요약 바는 선택 결과를 보여 줄 곳이 표 옆에 없어서 필요했지만, 여기서는 행동 버튼이 3안 바로 아래에 있다). 번들·포커스 가림(2.4.11) 부담도 없다.

### 5.2 키보드
- 순서: 건너뛰기 → 헤더 → h1 → "비교 보드에서 선택 바꾸기" → 출처 링크 → 대비 "보정값 쓰기"들 → 밀도·대비·모션·목적 라디오 그룹(각 Tab 정지 1) → "조정 저장"·"조정 취소" → 버전 줄 버튼 → "3안 만들기" → 카드별 "이 안 선택"·"섹션 순서 보기"·"전체 로그" → 편집 시작.
- 포커스 이동: 조정 저장 성공 → 이동 없음(알림만) · 되돌리기 → 새 버전 줄 · 비교 열기 → 비교 표 caption(`tabindex=-1`), 닫기 → 그 줄의 비교 버튼(최신을 볼 때 "현재와 비교", 이전 버전 vN을 볼 때 "vN과 비교" — r5) · 버전 보기(`?v=` 변경) → h1(`tabindex=-1`). 앱에 라우트 포커스 규칙은 아직 없다(`useRouteScroll`은 스크롤만, L1) — 이 화면 안의 버전 전환에만 적용한다 · 생성 완료 → 이동 없음.
- 모든 비활성 행동은 `aria-disabled` + 보이는 이유(보드 `confirmAvailability` 방식, `disabled` 속성 아님 — 포커스로 이유를 들을 수 있게). **예외**: 라디오 그룹 안 범위 밖 옵션은 roving에서 건너뛰고 이유를 그룹 설명으로 알린다(3.4).

### 5.3 라이브 영역
- `role=status` 1개 "프로필 알림"(저장·되돌리기·생성 진행/완료). `role=alert`는 실패일 때만(저장 실패 · 생성 전체/부분 실패). 알림 영역은 `display:none` 금지(D-QA06 규칙).
- 진행 알림은 단계가 바뀔 때만(시작 · 1/3 · 2/3 · 완료) — 같은 문장 반복 낭독 금지.

### 5.4 색 하나로만 알리지 않기 (C-12)
| 상태 | 색 외 단서 |
|---|---|
| 현재 버전 | Tag 글자 "현재" (목업은 점 색만) |
| 선택한 안 | "선택됨" 버튼 글자 + Tag "선택" |
| 대비 통과/미달 | "통과"/"미달" 글자 + 수치, 아이콘은 장식 |
| 범위 밖 옵션 | 캡션 "이 테마에서 쓸 수 없음" |
| 조정된 값 | 캡션 "조정됨" |
| lint 경고 | "경고 N" 글자 |
| A와 다른 축 | 캡션 "A와 다름" |

### 5.5 대비 (v2 SPEC 3절 방법)
- 화면 UI는 v2 토큰만 쓴다 — 새 글자 토큰 0. 쓰는 조합은 모두 v2 SPEC 3절에서 계산됨: 본문 `label-normal` · 캡션 `label-alternative`(흰 면 6.45, 최저 4.64) · 상태 글자 `status-*-text`(최저 4.60~4.68) · 선택 Tag 글자 `--brand-primary-text`(primary-container 위 5.80) · 테두리 primary 흰 면 4.95(UI 3:1).
- **프로필 색은 화면 글자에 쓰지 않는다.** 프로필 팔레트는 견본·썸네일(장식, `aria-hidden`)에만 칠한다 → 사용자 데이터 색이 화면 대비를 깨지 않는다(v2 C-10 열 문자 배지와 같은 원칙).
- 새 조합 1건 확인: 이전 버전 Callout(info-soft 위 `status-informative-text`)은 v2 3.2 상태 면 집합에 포함(4.60 이상) — 추가 계산 불필요.

---

## 6. 데이터 계약 (저장소 인터페이스 수준)

백엔드는 고르지 않는다. 현행 패턴(인터페이스 파일은 타입만 · 메모리 구현 · deferred 로더 · `delay`/`fail` 주입)을 따른다.

### 6.1 버전 계보 — 현재 사실 · 도입 위험 · 결정 (Q4=A)

**현재 확인된 사실 (L1, r1에서 r0 "문제" 문단을 정정)**
- 보드 다음 버전 라벨 = `confirmed.version + 1`(`domain/compareBoard.ts:204` `draftStatusOf` → `features/compare/draftLabels.ts:14`). 저장소 새 버전 = 계열 `max(version) + 1`(`data/memoryCompareBoardRepository.ts:100~104` `nextVersion`, 137~141행 `confirmProfile`·`createProfileVersion`).
- **지금은 두 값이 늘 같다.** 버전을 만드는 곳이 보드뿐이라 `board.confirmed.version`이 곧 계열 최대값이다 — 사용자에게 보이는 결함은 없다.
- `StoredProfile`에는 조정 필드가 없고 `/profile/:id`는 자리표시다 → "재확정 때 조정이 사라진다"는 **현재 동작이 아니다**(r0 과장 정정).
- 확정 요청에 기대 버전 조건이 없다(`confirmProfile(revision)` — `revision`은 보드 선택의 경쟁만 막는다).

**2a-04 도입 시 생길 위험 → 구현 계약과 테스트로 막는다**

| # | 위험 | 생기는 조건 | 계약 | 테스트 |
|---|---|---|---|---|
| D-1 | 보드 라벨 어긋남("(v2)"로 보이고 v4 생성) | 프로필 화면이 조정·되돌리기로 버전을 만든 뒤 보드가 `confirmed.version + 1`을 계속 씀 | 결정 1 | P-AC-11 |
| D-2 | 재확정 때 조정 손실, 또는 보드에서 고른 값이 조정에 덮임 | 조정 있는 계열을 보드에서 재확정 | 결정 2·3 | P-AC-20·38·39 |
| D-3 | 버전 경쟁(라벨 v3 · 실제 v4, 번호 중복) | 두 곳(보드·프로필 화면·다른 탭)이 같은 최신을 보고 쓰기 | 결정 4 | P-AC-17·40·41 |

**결정 (Q4=A, 2026-09-26 — Jarvis 수정안)**
1. **버전 번호는 계열에 하나.** 보드·프로필 화면 모두 저장소의 최신 버전을 읽는다. 보드: `getBoard`가 `ConfirmedRef`에 `latestVersion`, `latest`(최신 버전의 `base`·`adjustments`, 6.2 `ProfileHead`), `confirmedBase`(보드가 확정한 버전 `confirmed.version`의 `base`)를 **읽을 때 채운다**(보드 레코드에 저장하지 않음). `draftStatusOf`·`confirmLabel`은 `latestVersion + 1`(`latestVersion`이 없으면 지금처럼 `version + 1` — 기존 단언 유지).
2. **필드 소유를 나눈다.** 버전 = `base`(보드 유래 `DesignProfileInput` — 선택·팔레트·폰트·섹션·모션 기본·seed·library_version) + `adjustments`(프로필 화면 소유 — 밀도·대비·모션 덮어쓰기·목적·대비 보정). 적용된 값 = `effectiveProfile(base, adjustments)`(순수 함수). 저장·생성·비교는 모두 적용된 값을 쓴다.
3. **재확정 = 필드 단위 우선순위.** 순수 함수 `carryOverAdjustments(confirmedBase, latestAdjustments, nextBase) → CarryOverPlan`(6.4).
   - **보드에서 바뀐 필드**(새 base ≠ 비교 기준 base)는 **보드 값이 이기고, 그 필드와 겹치는 조정은 지운다.** 바뀌지 않은 필드의 조정은 **이어받는다.**
   - "바뀐 필드" 비교 기준 = **지난 확정 버전(`confirmed.version`)의 `base`**(`confirmedBase`). 이어받을 조정 = **최신 버전의 `adjustments`**(프로필 화면의 조정·되돌리기 결과 포함). 되돌리기가 끼어도 기준은 보드가 확정한 base 그대로다 — 보드에서 건드리지 않은 필드는 "바뀐 필드"가 되지 않으므로 패널 문장 "보드에서 모션을 바꿨습니다"가 늘 사실이고, 되돌린 모션 조정(절대값 덮어쓰기)은 사용자가 지금 보는 적용값 그대로 이어진다. 보정은 (a)가 `from`으로 판정하므로 기준과 무관하다. (검토한 대안 — 최신 버전 base 기준: 되돌리기 뒤 Hero만 바꿔도 모션 조정이 지워지고 거짓 이유 문장이 뜬다 → 기각)
   - **보드 초안 패널(P-S25)과 저장소 `confirmInto`가 같은 함수를 같은 입력(`ConfirmedRef.confirmedBase`·`latest.adjustments` + 보드 초안)으로 부른다** → 패널에 "이어짐"으로 보인 조정 = 저장되는 `adjustments`. 보드 AC-24 "보이는 초안 = 저장값"이 다시 성립한다: 저장 `base` = 보드 초안 그대로, 적용된 값 = 초안 + 패널에 보인 이어지는 조정.
   - 개수 단위: 조정 키 하나 = 1(밀도·대비·모션·목적), 보정은 항목 하나 = 1. 이어받을 조정이 0개면 패널 캡션을 숨긴다.
   - 지운 조정은 새 버전 요약에 한 줄("보드에서 모션을 바꿔 모션 조정을 지웠습니다"). 이어받은 값이 새 범위 밖이면 P-S13.

   **겹침 판정 표** (보드 필드 ↔ 조정 필드)

   | 조정 필드 | 겹치는 보드 필드 | 판정 | 지워질 때 문장(패널·버전 요약) |
   |---|---|---|---|
   | 모션 `adjustments.motion` | `base.motion_preset` | 보드 값이 바뀌면 **지움**, 같으면 이어받음 | "모션 L2 — 지워짐 · 보드에서 모션을 바꿨습니다" |
   | 밀도 `adjustments.density` | 없음 — 보드에 밀도 선택이 없고, 밀도는 보드 간격에 곱하는 상대값(3.4) | **항상 이어받음** | — |
   | 대비 `adjustments.contrast` | 없음 — 보드에 대비 수준 선택이 없음 | **항상 이어받음** | — |
   | 목적 `adjustments.purpose` | 없음 — 보드에 목적 입력이 없음(Q5) | **항상 이어받음** | — |
   | 보정 `adjustments.corrections[]` (a) | `base.color_tokens`의 그 역할 값 | 새 base의 역할 값 ≠ 보정 `from`이면 **지움**(r0 `{role, from, to}` 규칙 유지) | "ink 보정 — 지워짐 · 보드에서 팔레트를 바꿨습니다" |
   | 보정 (b) | 카드 톤 `component_choices.card_style.surfaceTone`·다른 역할 값(검사 쌍을 바꾸는 필드) | 이어받은 조정을 새 base에 적용해 **모든 검사를 다시 계산** — 보정 없이 통과하던 검사가 보정 때문에 미달이면 **지움** | "ink 보정 — 지워짐 · 새 카드 톤에서 대비가 맞지 않습니다" |

   - (b) 예: ref-b 팔레트 + 밝은 카드에서 ink를 `#7E622F`로 보정 → 보드에서 ref-b 어두운 카드로 바꿈. ink base 값은 그대로라 (a)로는 남지만 C-3이 7.3(보정 없음) → 2.8(보정)이라 (b)로 지운다. 지운 뒤 ink는 원값이라 3.3에 충돌(P-S15)이 다시 보인다 — 조용히 미달을 남기지 않는다.
4. **버전을 만드는 모든 쓰기에 `expectedLatest`**(Codex r0 #3). 보드 `confirmProfile(revision, expectedLatest)`·`createProfileVersion(profileId, revision, expectedLatest)`(첫 확정은 0), 프로필 `saveAdjustments(profileId, expectedLatest, adjustments)`·`revertTo(profileId, version, expectedLatest)` — **필수 인자**.
   - 저장소는 **비교와 생성을 원자적으로** 한다. 메모리: 최신 비교부터 배열 추가까지 동기 구간 하나(사이에 `await` 없음, `delay` 주입은 그 앞이나 뒤에만). HTTP: `If-Match: <expectedLatest>` + `(profile_id, version)` 유일 제약 조건부 삽입.
   - 불일치 → `STALE_PROFILE`, 새 버전 0건. 오류에 최신을 담는다(`STALE_BOARD`가 최신 보드를 담는 방식과 같음): **프로필 화면 쓰기(`saveAdjustments`·`revertTo`)는 최신 `ProfileSeries`, 보드 쓰기(`confirmProfile`·`createProfileVersion`)는 최신 `ProfileHead`**(`confirmedBase`는 보드 확정이 없었으니 그대로).
   - 보드 확정의 판정 순서: `SCHEMA_INVALID` → `STALE_BOARD`(보드 revision) → `STALE_PROFILE` → `UNSUPPORTED_COMBINATION`. 보드가 낡았으면 선택부터 다시 받아야 하고, `STALE_BOARD`가 담아 오는 최신 보드는 `getBoard`와 같이 `latest`를 채우므로 한 번 더 거부되지 않는다.
   - 호출자는 최신을 다시 읽어 버전 라벨과 P-S25 개수를 다시 계산하고, 사용자 입력(보드 선택·저장 안 된 조정)은 유지한다 → P-S12.
5. 모션 소유: 보드의 모션 선택은 `base.motion_preset`, 프로필 화면 모션은 **덮어쓰기**(`adjustments.motion`). 덮어쓰기가 있으면 화면에 "조정됨 · 보드 값 L2".

### 6.2 타입 (`domain/profile.ts` 제안 — 가벼운 타입·상수만, zod는 엔진 청크)

```ts
import type { DesignProfileInput, MotionPreset } from "./compareBoard";
import type { PurposeId } from "./reference";
import type { PaletteRole } from "./referenceDetail";
import type { ContrastCheckId } from "./contrast"; // "C-1"…"C-5"로 확장

export type Density = "comfortable" | "compact";
export type ContrastLevel = "aa" | "enhanced";
export type ProfileOrigin = "board" | "board-reconfirm" | "adjust" | "revert";

export interface PaletteCorrection {
  readonly role: PaletteRole;
  readonly from: string;          // #RRGGBB (적용 당시 base 값)
  readonly to: string;
  readonly check: ContrastCheckId;
}

/** 프로필 화면 소유 필드. 없으면 base 값 그대로 */
export interface ProfileAdjustments {
  readonly density?: Density;
  readonly contrast?: ContrastLevel;
  readonly motion?: MotionPreset;
  readonly purpose?: PurposeId | "none";
  readonly corrections?: readonly PaletteCorrection[];
}

/** 불변 레코드 (FR-PRF-03). 지금의 StoredProfile을 대체 — profile = effectiveProfile(base, adjustments) */
export interface ProfileVersion {
  readonly profileId: string;
  readonly version: number;
  readonly origin: ProfileOrigin;
  readonly basedOn?: number;       // revert 대상 · 이어받은 버전
  readonly boardRevision?: number; // board·board-reconfirm만
  readonly base: DesignProfileInput;
  readonly adjustments: ProfileAdjustments;
  readonly createdAt: string;
}

export interface ProfileSeries {
  readonly profileId: string;
  readonly versions: readonly ProfileVersion[]; // 오름차순
  readonly latestVersion: number;
}

export interface ProfileSummary {
  readonly profileId: string;
  readonly latestVersion: number;
  readonly baseReferenceId: string;
  readonly updatedAt: string;
}

/** 테마 허용 범위 — 지금은 기본 1벌, M2에서 무드별 */
export interface AdjustmentRange {
  readonly density: readonly Density[];
  readonly contrast: readonly ContrastLevel[];
  readonly motion: readonly MotionPreset[];
  readonly source: string; // "기본 범위" · 무드 이름
}

export type ProfileErrorCode = "NOT_FOUND" | "STALE_PROFILE" | "RANGE_VIOLATION" | "SCHEMA_INVALID";

/** 계열 최신 — 보드 ConfirmedRef.latest · STALE_PROFILE 오류 동봉 (r1) */
export interface ProfileHead {
  readonly version: number;
  readonly base: DesignProfileInput;
  readonly adjustments: ProfileAdjustments;
}

export type CarryOverKey = "density" | "contrast" | "motion" | "purpose" | "correction";
export interface CarryOverItem {
  readonly key: CarryOverKey;
  readonly role?: PaletteRole;                                   // correction만
  readonly reason?: "board-changed" | "palette-changed" | "new-contrast-failure"; // 지운 항목만
}
/** 보드 재확정 이어받기 계획 — 보드 패널(P-S25)과 저장소 confirmInto가 같은 값을 쓴다 (6.1-3) */
export interface CarryOverPlan {
  readonly kept: readonly CarryOverItem[];
  readonly dropped: readonly CarryOverItem[];
  readonly adjustments: ProfileAdjustments; // 새 버전에 저장될 조정 = kept만
}
```

보드 쪽 변경 (`domain/compareBoard.ts`·`data/compareBoardRepository.ts`, r1):

```ts
export interface ConfirmedRef {
  // …기존 profileId · version · revision · picks · custom
  readonly latestVersion?: number;  // getBoard가 읽을 때 채움(저장 안 함). 없으면 version
  readonly latest?: ProfileHead;    // 이어받을 조정 = latest.adjustments (P-S25)
  readonly confirmedBase?: DesignProfileInput; // confirmed.version의 base — "보드에서 바뀐 필드" 비교 기준
}
export type CompareBoardErrorCode = "STALE_BOARD" | "UNSUPPORTED_COMBINATION" | "SCHEMA_INVALID" | "LICENSE_BLOCKED" | "STALE_PROFILE";
// CompareBoardError: STALE_PROFILE일 때 profileHead?: ProfileHead 동봉
// CompareBoardRepository
confirmProfile(revision: number, expectedLatest: number): Promise<ConfirmResult>;                      // 첫 확정 0
createProfileVersion(profileId: string, revision: number, expectedLatest: number): Promise<ConfirmResult>;
```

`ProfileVersion`에 `readonly dropped?: readonly CarryOverItem[]`(board-reconfirm만 — 버전 요약 문장)을 더한다. `profile.ts` ↔ `compareBoard.ts`는 서로 `import type`만 한다(런타임 순환 0, P-B5).

생성 (`domain/generation.ts` 제안):

```ts
export type CandidateId = "A" | "B" | "C";
export type GridStyle = "grid-3" | "grid-2" | "masonry";
export type JobState = "queued" | "running" | "succeeded" | "partial" | "failed";
export type GenerationErrorCode = "UNSUPPORTED_COMBINATION" | "SCHEMA_INVALID" | "JOB_TIMEOUT" | "INFRA";

export interface CandidateAxes {
  readonly heroVariant: string;
  readonly grid: GridStyle;
  readonly typeScale: number;
}
export interface PlannedSection extends SectionPlanEntry { readonly motion: MotionPreset }
export interface LintIssue {
  readonly rule: "R-01" | "R-02" | "R-03" | "R-04" | "R-07" | "R-08" | "R-12";
  readonly severity: "block" | "info";   // block = 발행 차단 대상(2a-04는 경고로만 표시)
  readonly message: string;               // 원인 · 대체안
  readonly sectionIndex?: number;
}
export interface CandidatePlan {
  readonly id: CandidateId;
  readonly axes: CandidateAxes;
  readonly sections: readonly PlannedSection[];
  readonly summary: readonly [string, string, string]; // FR-GEN-05 3줄
  readonly log: readonly string[];                     // 전체 로그
  readonly lint: readonly LintIssue[];
  readonly hash: string;                               // FNV-1a 8자리 (profileDraft와 같은 함수)
}
export type CandidateResult =
  | { readonly id: CandidateId; readonly status: "succeeded"; readonly plan: CandidatePlan }
  | { readonly id: CandidateId; readonly status: "failed"; readonly errorCode: GenerationErrorCode; readonly retryable: boolean; readonly message: string }
  | { readonly id: CandidateId; readonly status: "pending" };

export interface GenerationJob {
  readonly jobId: string;
  readonly profileId: string;
  readonly version: number;
  readonly libraryVersion: string;
  readonly generatorVersion: string;   // "preview-1" (구조안). M2 = 서버 생성기 버전
  readonly seed: string;
  readonly state: JobState;
  readonly candidates: readonly CandidateResult[]; // 항상 A·B·C 3개
  readonly selected?: CandidateId;
  // M2에서 추가: previewUrl, artifactHash, gateReport (TRD 4.5)
}
```

### 6.3 저장소

**`ProfileRepository`** (`data/profileRepository.ts` — 타입만)

| 메서드 | 대응 API (TRD 5 기준, Q6) | 설명 |
|---|---|---|
| `listProfiles(): Promise<readonly ProfileSummary[]>` | (신규) `GET /profiles` | `/profile` 목록(P-S04·05) |
| `getProfile(profileId): Promise<ProfileSeries \| undefined>` | `GET /profiles/{id}` + `…/versions` | 없으면 `undefined` → P-S02(예외 아님) |
| `getAdjustmentRange(profileId, version): Promise<AdjustmentRange>` | (신규) `GET /profiles/{id}/versions/{v}/range` | 3.4 범위 |
| `saveAdjustments(profileId, expectedLatest, adjustments): Promise<ProfileVersion>` | `POST /profiles/{id}/versions` (`If-Match: latest`) | zod 검증. 범위 밖 → `RANGE_VIOLATION`. `expectedLatest ≠ latest` → `STALE_PROFILE`(최신 계열 동봉). 조정이 최신과 같으면 `SCHEMA_INVALID`("바뀐 조정 없음" — 버튼이 먼저 막음) |
| `revertTo(profileId, version, expectedLatest): Promise<ProfileVersion>` | `POST /profiles/{id}/versions` (`revert_of`, `If-Match: latest`) | 대상 복사로 새 버전, 이전 레코드 불변. `expectedLatest ≠ latest` → `STALE_PROFILE`(r1) |

**원자적 버전 생성 (r1, 6.1-4)**: 위 두 메서드와 보드 `confirmProfile`·`createProfileVersion`은 모두 `expectedLatest`를 받아 한 저장소(공유 store) 안에서 비교·생성을 한 번에 한다. 네 쓰기가 같은 계열 카운터를 쓰므로 번호가 겹치거나 건너뛰지 않는다. 보드 `getBoard`는 `ConfirmedRef.latestVersion`·`latest`를 같은 store에서 읽어 채운다(보드 래퍼 메서드 추가 0).

**보드 확정의 트랜잭션 경계 (r2·r3, Codex r1 #1·r2 #1)**: 보드 `confirmProfile`·`createProfileVersion`은 **① `expectedLatest` 비교 ② 프로필 버전 삽입 ③ 보드 `confirmed`(profileId·version·confirmedBase)·revision 갱신**을 하나의 작업으로 커밋하거나 함께 롤백한다. HTTP는 보드 확정을 한 엔드포인트(`POST /boards/{id}/confirm`, `If-Match: latest` + 보드 revision)로 두고 서버 한 트랜잭션에서 ①~③을 처리한다 — 클라이언트가 프로필 삽입과 보드 갱신을 두 요청으로 나누지 않는다. 실패는 두 종류로 나눈다.
- **커밋 전 실패**(롤백): 메모리 구현은 ①~③을 `await` 없이 한 동기 구간에서 처리하고, 실패 주입에 **`phase: "commit"`**(② 뒤 ③ 앞)을 추가한다(현행 `call()`의 `fail`은 `phase: "request"`만 있다 — `memoryCompareBoardRepository.ts` 59~68행). `commit` 실패면 ②를 되돌려 store 변화 0. 이 경우 같은 인자로 재시도하면 성공한다.
- **커밋 뒤 응답 실패**(롤백하지 않음 — 멱등 재시도): 현행 `call()`은 `work()` 뒤 `phase: "response"` 지연을 기다리므로, 여기서 거부되면 호출자는 실패를 보지만 저장은 이미 끝났다. 그래서 확정 쓰기는 **멱등 키 = (보드 id, 호출자가 본 보드 revision, `expectedLatest`)**를 쓴다. 이 키는 기존 인자에서 나오므로 새 인자가 필요 없다. store는 계열마다 마지막 커밋의 키와 결과를 기억하고, **같은 키의 재시도는 `STALE_BOARD`·`STALE_PROFILE` 판정보다 먼저** 그 결과를 그대로 돌려준다(새 버전 0). 다른 키는 지금 규칙대로 판정한다. HTTP는 같은 키를 `Idempotency-Key`로 보낸다.

비교는 API가 아니라 순수 함수 `diffProfiles(a, b)`(두 적용된 값의 필드 차이).

**`GenerationRepository`** (`data/generationRepository.ts` — 타입만)

| 메서드 | 대응 API | 설명 |
|---|---|---|
| `requestGeneration(profileId, version): Promise<GenerationJob>` | `POST /projects/{id}/generate` → 프로젝트가 없으므로 (신규) `POST /profiles/{id}/versions/{v}/generate` (Q6) | **멱등**: 키 = (profileId, version, libraryVersion, generatorVersion). 이미 있으면 그 잡을 돌려준다(새 계산 없음) |
| `getJob(jobId): Promise<GenerationJob>` | `GET /jobs/{job_id}` | 화면은 종료 상태(`succeeded`·`partial`·`failed`)까지 1초 간격 조회. 메모리 구현은 조회마다 한 안씩 진행(테스트에서 단계 재현) |
| `findJob(profileId, version): Promise<GenerationJob \| undefined>` | (신규) `GET /profiles/{id}/versions/{v}/jobs/latest` | 진입 시 기존 결과 표시(P-S17 vs P-S19) |
| `retryFailed(jobId): Promise<GenerationJob>` | (신규) `POST /jobs/{id}/retry` | `retryable` 실패 안만 다시. 결정적 실패는 거부 |
| `selectCandidate(jobId, id): Promise<GenerationJob>` | (신규) `PUT /jobs/{id}/selection` | 성공한 안만 |

**메모리 구현과 저장 공유**
- 지금 프로필은 `memoryCompareBoardRepository` 클로저 배열에 있고 id는 저장소 인스턴스마다 `profile-${n}`이다. 테스트는 `renderApp`이 렌더마다 보드 저장소를 새로 만들어 주입한다(`AppProviders boardRepository=`) → 그래서 `CompareBoardPage.test.tsx`의 `/profile/profile-1` 단언 4곳이 테스트마다 성립한다.
- **저장소는 팩토리**(`createStudioStore()`: 프로필 계열·잡)로 꺼낸다. **모듈 싱글턴은 쓰지 않는다** — Vitest는 파일 단위로만 모듈을 격리해 같은 파일의 두 번째 테스트가 `profile-2`를 받고 위 4곳이 깨진다.
- 이음새: 앱은 `main.tsx`의 deferred 로더가 store 하나를 만들어 보드·프로필·생성 메모리 구현에 함께 넘긴다. 화면은 새 컨텍스트(`ProfileRepositoryContext`: 프로필 + 생성 저장소)로 받는다 — `AppProviders`에 prop 2개가 는다(**공통 청크 비용, P-B2에서 실측**). 테스트는 `renderApp`이 렌더마다 store를 새로 만든다(id가 늘 `profile-1`부터).
- 대안(공통 비용이 `/compare` 여유를 넘을 때만): 모듈 싱글턴 + 테스트 setup의 `resetStudioStore()` — 공통 0바이트지만 숨은 전역 상태라 우선순위가 낮다. Developer가 실측 후 고르고 보고한다. 보드 `confirmInto`는 이 저장소에 `origin: board | board-reconfirm` 버전을 쓰고, `expectedLatest` 비교 뒤 6.1-3 `carryOverAdjustments`를 적용한다.
- 모든 레코드 `deepFreeze`(현행과 같음). `delay`·`fail` 주입 옵션을 세 구현이 같은 모양으로 받는다(P-S11·S18·S20·S21 테스트).
- 메모리 생성 구현 = `composeCandidates` 호출 + 잡 상태 진행. M2에서 HTTP 구현으로 바꿔도 인터페이스는 그대로.

### 6.4 순수 함수 (엔진, 모두 Vitest)
`effectiveProfile(base, adj)` · `carryOverAdjustments(confirmedBase, latestAdjustments, nextBase)`(r1 — **보드 청크와 프로필 저장소가 함께 import**하므로 zod 없이 `contrast.ts`·`profile.ts` 상수만 쓴다) · `checkProfileContrast(palette, cardTone, level)`(`contrast.ts` 확장, zod 없음 — 이어받기 (b) 판정에 쓰여 보드 청크에도 들어간다) · `proposeCorrections(palette, cardTone, level)`(충돌 판정 포함) · `diffProfiles(a, b)` · `composeCandidates(profile, purpose, library, generatorVersion)` · `lintPlan(plan, profile, purpose)` · `summarizeVersion(prev, next)`(버전 줄 요약) · `adjustmentSchema`(zod, 범위 인자).

### 6.5 계측 (PRD 9)
`profile_saved(version, origin)` — 조정 저장·되돌리기·보드 확정 · `generation_requested(version)` · `generation_succeeded(version, count)` · `generation_failed(reason=errorCode)` · (제안) `candidate_selected(id)`. 사용자 입력 원문·색 값은 넣지 않는다.
- r5: 되돌리기(와 이후 버전 생성 쓰기) 실패 = `profile_save_failed(reason = 오류 코드 | UNKNOWN)`. 수집기 전에는 `window` 이벤트 `studio:profile`로 낸다(2a-04a2 Q4=A).

---

## 7. 번들 (ADR-004)

기준선(QA-V2-FINAL, gzip KB, 첫 화면 / 진입 직후): 공통 **88.67** · 자리표시(= 지금 `/profile`) **89.12 / 91.51** · `/compare` **98.51 / 120.97(여유 1.49)** · `/catalog` 98.50 / 100.88.

| # | 규칙 | 효과 |
|---|---|---|
| P-B1 | 라우트: `routes.tsx` lazy 교체(`/profile`·`/profile/:profileId` → `ProfilePage`, `/studio`는 자리표시 유지) | 공통 +수십 바이트(L3) |
| P-B2 | 프로필·생성 **메모리 구현은 동적 import**(deferred, 기존 보드 로더와 같은 청크에서 store 공유). 공통에 들어가는 것: `main.tsx` deferred 래퍼 2개(메서드 5+5개 위임) · `AppProviders` prop 2개 · `ProfileRepositoryContext` · `draftStatusOf` 한 줄. 보드 deferred 래퍼에는 **메서드를 더하지 않는다**(`ConfirmedRef.latestVersion`·`latest`는 필드라 타입 0바이트). 단 r1에서 `confirmProfile`·`createProfileVersion`이 인자 `expectedLatest`를 하나씩 더 받는다 — 래퍼가 인자를 하나씩 넘기므로(`deferredCompareBoardRepository.ts:28~29`) 수십 바이트가 공통에 는다. **r4**: `STALE_PROFILE` 오류에 동봉하는 `profileHead`도 공통 청크(보드 오류 클래스)에 든다 — 2a-04a1 실측 공통 88.66 → 88.69KB(+0.03, 영환님 A-Q5) | **공통 증가 ≠ 0**(L3 추정 약 0.3~0.5KB) → `/compare` 여유 1.49 안인지 2a-04a에서 먼저 실측. 넘치면 6.3 대안(싱글턴 + reset) 또는 BUNDLE-01 C8(보드 페이지 일부를 엔진 청크로)로 상쇄하고 보고 |
| P-B3 | **아이콘 파일 추가 0.** `Icon`의 eager glob이 모든 아이콘 URL을 공통 청크에 넣는다(v2 B-3). 목업의 `file`·`refresh`는 쓰지 않는다(생성 로그 = 글자 펼침, 다시 생성 = 없음 4.5). 쓰는 아이콘은 이미 파일인 것만: `arrow-right`(편집 시작) · `warning`·`circle-check`(대비·lint, 장식) · `chevron-down`(펼침). 첫 방문 SVG 요청이 생기는 것은 BUNDLE-01 C1과 같은 대가 | 공통 0 |
| P-B4 | 새 아이콘이 꼭 필요하면 `build/notInlinedIcons.ts`에 넣어 **파일로** 둔다(가드 테스트 갱신) — 인라인 금지 | 공통 URL 문자열만 |
| P-B5 | **`import type` 필수**: 라우트 청크·엔진이 타입만 쓰는 import는 `import type`(인라인 `type` 지정자만 남은 import는 부수효과 import가 되어 모듈 사슬을 끌어온다 — BUNDLE-01 e6/e6b) | 숨은 증가 0 |
| P-B6 | 청크 나눔: **첫 화면**(`ProfilePage` 청크) = 화면 틀·프로필 값·팔레트 견본·버전 목록·조정 컨트롤·카드 틀. **진입 직후 엔진**(`profileEngine` 동적 청크) = zod 스키마·`composeCandidates`·`lintPlan`·`proposeCorrections`·`diffProfiles` + 메모리 저장소·픽스처 | 목표(L3 추정): 첫 화면 청크 ≤ 8KB → 합계 ≈ 97KB(≤ 100) · 엔진 ≤ 15KB → 진입 직후 ≈ 115KB(≤ 125) |
| P-B7 | `SegmentedControl`·`Callout`·`Tag`는 카탈로그·상세·보드와 **공유 청크**가 될 수 있다(rolldown 분할). 분할이 생기면 다른 라우트 합계가 청크 경계 비용만큼 늘 수 있다(BUNDLE-01 2.3: 경계당 약 +0.5KB) → **`/catalog`(여유 1.50)·`/compare`(1.49)도 단계마다 실측** | 넘치면 해당 컴포넌트를 이 라우트에 두지 않는 대안(Q 아님, Developer 판단 → 넘치면 보고) |
| P-B8 | 데이터 청크(픽스처)는 ADR-005 D3대로 진입 직후 합계에 넣지 않는다(참고 출력) | — |
| P-B9 | **보드 라우트 청크 증가(r1)**: `carryOverAdjustments` · `checkProfileContrast`(C-4·C-5 확장분) · P-S25 캡션·목록 문구 · `STALE_PROFILE` 처리(`useCompareBoard.ts:237~238` 확정 경로) · `draftStatusOf` `latestVersion` 분기 | L3 추정 +0.4~0.8KB → `/compare` 진입 직후 여유 1.49 안인지 **2a-04a(라벨·STALE)·2a-04b(패널·이어받기) 각각 실측**. 넘치면 판정 함수·목록 문구를 보드 엔진 쪽 동적 청크로 옮긴다(BUNDLE-01 C8 방식) — Developer 판단, 보고 |

---

## 8. 단계 구현 계획 · 수용 기준

### 8.1 순서

| 단계 | 범위 | 선행 | 규모(추정) |
|---|---|---|---|
| **2a-04a** 프로필 조회·버전 | 공유 저장 모듈 · `ProfileRepository`(조회·목록·되돌리기) · 버전 계보(6.1-1: 보드 라벨 `latestVersion`) · **`expectedLatest` 원자적 생성·`STALE_PROFILE`(보드 확정·되돌리기, 6.1-4)** · `/profile` 목록·`/profile/:id` 화면(값·출처·팔레트·대비 검사 **표시**·버전 목록/보기/비교/되돌리기) · P-S01~S09·S12(보드 확정·되돌리기 문장)·S16 · 라우트 교체 | 없음 | 가장 큼 — 턴 예산을 넘으면 **a1 데이터 계층 / a2 화면**으로 나눈다(M1-UI-03a/b 선례) |
| **2a-04b** 전역 조정·대비 보정 | `getAdjustmentRange`·`saveAdjustments` · 밀도·대비·모션·목적 컨트롤(`SegmentedControl` disabled 확장) · 보정 제안 적용·충돌 · **필드 단위 이어받기**(6.1-3 `carryOverAdjustments`) · 보드 P-S25 패널 · 조정 저장 `STALE_PROFILE` · P-S10~S15·S25 | 2a-04a | 중간 |
| **2a-04c** 3안 생성·비교 | `composeCandidates`·`lintPlan` · `GenerationRepository`(잡·멱등·재시도·선택) · 카드·썸네일·비교 표·로그·결정성 표시 · 편집 시작 경계 · P-S17~S24 | 2a-04b(목적·대비 조정이 입력) | 중간~큼 |
| QA-2A-04 | 5폭 × `/profile`·`/profile/:id` 캡처, 키보드·AX 트리, 번들, 대비 | 2a-04c | — |

각 단계 PROGRESS에 11절 M-번호를 한 줄씩 인용한다(ADR-003).

### 8.2 수용 기준

태그: **[V]** Vitest · **[Q]** QA 브라우저(ego-browser 뷰포트 캡처) · **[B]** 빌드 출력.

| ID | 단계 | 기준 | 검증 |
|---|---|---|---|
| P-AC-01 | a | 보드 확정 → `/profile/:id`에 h1 "디자인 프로필", 버전 Tag "v1 · 현재", 3.1 표의 필드가 모두 보인다(값 누락 0) | [V] |
| P-AC-02 | a | 없는 id(새로고침 포함) → P-S02: h1 "프로필을 찾을 수 없습니다" + "비교 보드로" 버튼, `role=alert` 없음 | [V] |
| P-AC-03 | a | `/profile` 목록: 프로필 0 → P-S04 안내 · 1 이상 → 줄마다 기준 레퍼런스 제목·최신 버전·열기 링크 | [V] |
| P-AC-04 | a | 출처: 제목 링크 · 업종 · 라이선스 Tag. 회수·비노출 id → "출처 회수됨" 글자 + 링크 없음. 레퍼런스 이미지·외부 URL 0 | [V] |
| P-AC-05 | a | 대비 검사 C-1~C-5를 3.3 픽스처 표와 같은 수치·보정값으로 표시(ref-a C-5 `#8E715B` 4.5 · ref-d C-1 `#00866A` · ref-f C-1 `#AF6300`). C-3은 어두운 카드에서만(ref-b C-3 7.3 통과), 밝은 카드면 C-3 줄 없음 — 스크립트 값(C-3 포함, r1)이 테스트 기대값 | [V] |
| P-AC-06 | a | ref-b(어두운 카드) → ink 보정은 **충돌**: 후보 `#7E622F`(C-4 1.7 → 4.5)를 쓰면 C-3 7.3 → 2.8 → "보정값 쓰기" 없음 + 대체안 문장 + "비교 보드에서 카드 바꾸기". 강화에서도 충돌(`#5B4722`, C-3 1.8). muted는 충돌 아님(`#7B766E` 보정 제공) | [V] |
| P-AC-07 | a | 버전 목록: 버전마다 번호·출처·요약·시각, 현재 버전은 Tag 글자 "현재". 버전 1개면 비교·되돌리기 없음 + 안내 | [V] |
| P-AC-08 | a | `?v=1` → P-S07 Callout, 조정 컨트롤 `aria-disabled` + 이유, 포커스 h1 | [V] |
| P-AC-09 | a | "현재와 비교" → 필드 차이 표(caption "v1과 v3 비교"), 바뀐 줄에 "바뀜". 같은 값 두 버전 → "두 버전의 값이 같습니다" | [V] |
| P-AC-10 | a | 되돌리기 → 새 버전(origin revert, basedOn) 생성, **이전 레코드 불변**(동결·값 비교), 알림 + 포커스 새 버전 줄 | [V] |
| P-AC-11 | a | **버전 계보**: 프로필 쪽에서 v2를 만든 뒤 보드에서 선택을 바꾸면 보드 버튼이 "새 버전으로 확정 (v3)"이고, 확정 결과도 v3 | [V] |
| P-AC-12 | b | 조정 4그룹이 라디오 그룹(이름 "밀도"·"대비"·"모션"·"사이트 목적"), 방향키·Home/End 이동, 선택값이 보이는 글자, Tab 정지 그룹당 1 | [V] |
| P-AC-13 | b | (메모리 구현에 좁은 `range` 주입) 범위 밖 옵션은 `aria-disabled` + 이유 캡션, roving에서 건너뜀, 이어받은 범위 밖 값은 P-S13 Callout + "맞추기". 모션 L3 옵션 없음. 저장소는 범위 밖 저장을 `RANGE_VIOLATION`으로 거부 | [V] |
| P-AC-14 | b | 조정 변경 → "저장하지 않은 조정 N개" · "조정 저장 (v2)" 활성 · 3안 만들기 `aria-disabled` + 이유. 취소 → 원래 값 | [V] |
| P-AC-15 | b | 저장 → 새 버전 1개(origin adjust), 적용된 값 반영(밀도 촘촘 96 → 72, 모션 덮어쓰기 "조정됨 · 보드 값 L2"), 알림 "v2로 저장했습니다" | [V] |
| P-AC-16 | b | 저장 중 연타 → 저장 1회. 실패 → `role=alert` + 조정 유지 + 다시 시도 | [V] |
| P-AC-17 | b | `STALE_PROFILE` → 최신 계열 반영 + 조정 유지 + 안내 문장(P-S12) | [V] |
| P-AC-18 | b | "보정값 쓰기" → 조정에 보정 추가, 저장하면 적용된 팔레트가 보정값이고 해당 검사 "통과" | [V] |
| P-AC-19 | b | 대비 "강화" → 검사 목표 7.0, 제안값 = 3.3 표 강화 열(ref-a primary `#775033`·muted `#6A5544` · ref-d primary `#006550` · ref-e ink `#4C22F0` 등) | [V] |
| P-AC-20 | b | 이어받기(r1: 필드 단위, 6.1-3): 조정 있는 v2 뒤 보드 재확정 → v3 `base` = 보드 초안, 보드에서 안 바뀐 필드의 조정은 이어받음. 팔레트가 바뀐 역할의 보정은 빠지고 버전 요약에 한 줄. 이어받은 값이 범위 밖이면 P-S13 | [V] |
| P-AC-21 | c | `composeCandidates` 결정성: 같은 입력 2회 → 3안 해시 동일. 입력 하나(목적·버전 조정·seed·라이브러리 버전)만 바꿔도 해시가 바뀐다 | [V] |
| P-AC-22 | c | 3안은 서로 **3축 모두 다름**(모든 쌍), A안 축 = 프로필 값 | [V] |
| P-AC-23 | c | 구조 규칙: booking → contact 포함 · inquiry → 후반 1/3에 cta-band/contact · 본문 5~9(초과 시 제외 로그) · L2 섹션 ≤ 3 · footer 사업자정보 | [V] |
| P-AC-24 | c | 로그: 안마다 정확히 3줄(적용 규칙 · 축 변경 · 제외 후보), 전체 로그 펼침 | [V] |
| P-AC-25 | c | lint 경고: 규칙 ID · 원인 · 대체안, "경고 N" 글자. 목적 "정하지 않음"이면 R-03·R-04 정보 한 줄. 경고가 있어도 선택 가능 | [V] |
| P-AC-26 | c | 생성 흐름 P-S17 → S18 → S19: 버튼 `aria-busy`, 카드 자리 고정, `role=status` 단계 알림(시작·1/3·2/3·완료, 같은 문장 반복 0) | [V] |
| P-AC-27 | c | 부분 실패: 재시도 가능 오류만 "C안 다시 시도"(그 안만 재계산), 결정적 실패는 재시도 없음 + 원인. 전체 실패 `Callout negative` + `role=alert` | [V] |
| P-AC-28 | c | **멱등·재현**: 같은 버전 "3안 만들기" 재요청 → 같은 잡(계산 0회 추가). 되돌린 버전 → 처음과 같은 해시. "다시 생성" 버튼 없음 | [V] |
| P-AC-29 | c | 선택: "이 안 선택" `aria-pressed`, 선택 카드 "선택됨" 글자 + Tag, 다시 들어와도 유지. 선택 전 "편집 시작" `aria-disabled` + 이유, 선택 후 이름 "B안으로 편집 시작" | [V] |
| P-AC-30 | c | 썸네일: 자체 와이어프레임(`aria-hidden`), 색은 프로필 토큰 데이터, 컴포넌트 hex 0(`noHardcodedStyle`), 외부 이미지 0. "구조 미리보기" 캡션 항상 보임 | [V] |
| P-AC-31 | c | 결정성 캡션(버전 · 라이브러리 · seed · 생성기)과 카드 해시 표시 | [V] |
| P-AC-32 | 전 단계 | 5폭(1920·1280·1024·768·390) 가로 넘침 0, 5.1 배치(1280 2단 · 1024/768 1단 3열 · 390 1열, 비교 표 ≥768) | [Q] |
| P-AC-33 | 전 단계 | 키보드 순서 = DOM = 보이는 순서(5.2), 모든 비활성 행동 `aria-disabled` + 보이는 이유(범위 밖 라디오 옵션은 건너뛰고 그룹 설명에 이유 — 5.2 예외), 포커스가 가려지지 않음 | [V] · [Q] |
| P-AC-34 | 전 단계 | 화면 글자 대비 ≥ 4.5 / UI ≥ 3 (v2 토큰만, 프로필 색은 장식에만). 상태를 색 하나로 알리는 곳 0(5.4 표) | [V] 가드 · [Q] |
| P-AC-35 | 전 단계 | 번들: `/profile` 첫 화면 ≤ 100 · 진입 직후 ≤ 125 **실측 보고**, 공통 증가 내역(P-B1·B2만), `/catalog`·`/compare`·상세 재측정, 아이콘 파일 추가 0 | [B] |
| P-AC-36 | 전 단계 | 검증 4종(typecheck·lint·test·build) 통과. 깨진 기존 테스트는 9절 목록 안에서만, 테스트 수 변화 보고 | [B] |
| P-AC-37 | 전 단계 | 계측 호출 지점(6.5)이 저장·생성 성공/실패·선택에서 1회씩, 개인정보·색 값 없음 | [V] |

| P-AC-38 | b | **보드 값 우선(Codex r0 #1)**: v2 조정 = 밀도 촘촘 + 모션 덮어쓰기. 보드에서 모션 선택을 v2 base와 다른 값으로 바꾸면 초안 패널 "이어지는 조정 1개 · 지워지는 조정 1개" + 목록 "모션 … — 지워짐 · 보드에서 모션을 바꿨습니다" / "밀도 촘촘 — 이어짐" → 재확정 → v3 적용된 모션 = 보드 값, `adjustments.motion` 없음, `adjustments.density` = 촘촘(간격 96 → 72 유지), 버전 요약에 지운 조정 한 줄 | [V] |
| P-AC-39 | b | **패널 = 저장값**: ① 보드 패널과 저장소가 같은 `carryOverAdjustments`를 부른다 — 입력 표(모션·밀도·대비·목적·보정 a/b 각 1행) 단위 테스트 + 패널 "이어짐" 목록 = 저장된 `adjustments` ② 겹치지 않는 필드만 바꾼 재확정(예: Hero) → "지워지는 조정 0개", 조정 전부 이어받음 ③ ref-b 팔레트 + 밝은 카드에서 ink 보정 `#7E622F` 저장 → 보드에서 어두운 카드로 바꾸면 보정이 "지워짐 · 새 카드 톤에서 대비가 맞지 않습니다"(C-3 2.8), 확정 뒤 3.3 충돌 표시 ④ 조정 0개면 캡션 없음 ⑤ 개수·상태는 글자(색 하나로만 알리지 않음) ⑥ **되돌리기 뒤 재확정**(r2 — 번호 연속): v1 보드 확정 → v2 프로필 조정 저장(모션 덮어쓰기) → v3 보드에서 모션을 바꿔 재확정(모션 조정 지워짐, 확정 = v3) → v4 프로필에서 v2로 되돌리기(모션 덮어쓰기 복원) → 보드에서 Hero만 바꿔 재확정 → 비교 기준은 **확정 버전 v3의 base**라 모션은 "바뀌지 않음" → 모션 조정 "이어짐", v5 적용된 모션 = v4와 같음(최신 v4 base 기준이었다면 모션 조정이 잘못 지워진다 — 6.1-3 근거) | [V] |
| P-AC-40 | a | **보드 확정 경쟁(Codex r0 #3)**: 보드가 최신 v2를 보고 "새 버전으로 확정 (v3)" 표시 → 같은 store에서 다른 쓰기(다른 탭 = 테스트에서 `revertTo` 직접 호출)로 v3 생성 → 보드 확정 클릭 → `STALE_PROFILE` 거부, **확정 0건**(계열 버전 수 +1은 다른 쓰기의 v3뿐), 버튼 "새 버전으로 확정 (v4)"로 갱신 + P-S12 보드 안내, 선택 유지·이동 없음. 다시 확정 → v4 | [V] |
| P-AC-41 | a | **원자성**: 같은 `expectedLatest`로 버전 생성 쓰기 2개를 동시에(`Promise.all`, 응답 `delay` 주입 — 보드 확정 + 되돌리기 조합) → 정확히 1개 성공, 1개 `STALE_PROFILE`, 버전 번호 연속·중복 0. 되돌리기가 거부되면 보기 상태 유지 + P-S12 문장. 네 쓰기 모두 `expectedLatest`가 필수 인자(빠지면 typecheck 실패) | [V] |
| P-AC-42 | a | **보드 확정 원자성·멱등(Codex r1 #1·r2 #1)**: ① `fail`에 `phase: "commit"` 주입해 확정 → 오류 알림, **계열 버전 수 변화 0 · 보드 `confirmed`·revision 불변**, 선택 유지 → 주입을 끄고 같은 화면에서 다시 확정 → 성공, 번호 연속(건너뜀 0) ② `delay`의 `phase: "response"`에서 거부 → 오류 알림이지만 store에는 버전 1개 커밋 → 같은 화면에서 다시 확정 → `STALE_*` 없이 **같은 결과**(같은 profileId·version), 계열 버전 수 +1(두 번째 호출이 새 버전을 만들지 않음) ③ 다른 revision이나 다른 `expectedLatest`로 호출하면 멱등 결과를 돌려주지 않고 기존 판정(`STALE_BOARD`/`STALE_PROFILE`) | [V] |

**42개.** 단계별: a 14 · b 11 · c 11 · 공통 6. (r1 추가: P-AC-38·39 b · P-AC-40·41 a. r2 추가: P-AC-42 a. 기존 번호 유지, P-AC-05·06·19·20은 기대값·범위만 보강)

---

## 9. 깨질 기존 테스트 (예상, L1 grep)

| 파일 | 깨지는 단언 | 단계 | 처리 |
|---|---|---|---|
| `pages/CatalogPage.test.tsx` 355~356행 | `/profile/profile-1` → h1 "디자인 프로필" + "다음 단계에서 구현됩니다" · `/profile` → "디자인 프로필 · 3안 생성" | a | 두 줄을 표에서 빼고 `/studio`만 남긴다. `/profile*`는 새 페이지 테스트가 맡는다(직접 진입 = P-AC-02·03) |
| `pages/CompareBoardPage.test.tsx` 305·377·397·413행 | 확정 후 경로 `/profile/profile-1` | a | **깨지지 않아야 한다**(id 규칙 유지). 깨지면 저장소 id 규칙 변경 신호 |
| `data/memoryCompareBoardRepository.test.ts` | `getProfileVersions`·확정 레코드 모양(`StoredProfile`) | a | 공유 저장 모듈 + `ProfileVersion`(base·adjustments·origin)으로. 버전 번호·불변 단언은 유지 |
| `domain/compareBoard.test.ts`·`components/compare/DraftPanel.test.tsx`·`DraftSummaryBar.test.tsx`·`pages/CompareBoardResponsive.test.tsx`·`compareBoardV2.test.tsx` | "새 버전으로 확정 (v2)" 계산이 `confirmed.version + 1` 전제 | a | `latestVersion` 없을 때 같은 값이 나오게 해 **기존 단언은 유지**, P-AC-11 새 테스트 추가 |
| `components/compare/DraftPanel.test.tsx` (r1) | 초안 패널 문구 — P-S25 캡션 추가 | b | 조정 0개면 캡션이 없으므로 **기존 텍스트 단언 유지**. 깨지면 숨김 조건 오류 신호. P-AC-38·39 새 테스트 |
| `pages/CompareBoardPage.test.tsx` 339행 `toHaveBeenCalledWith(saved.revision)` · 385행 `toHaveBeenCalledWith("profile-1", expect.any(Number))` (r1) | 확정 요청 인자 변경 — `expectedLatest`가 더해져 인자 수가 달라 깨짐 | a | 새 인자를 단언에 더한다(첫 확정 `0` · 재확정 `expect.any(Number)` 또는 최신 버전). 306·405·426·443행 `toHaveBeenCalledTimes`, 364행 `STALE_BOARD` 목은 유지 |
| `data/memoryCompareBoardRepository.test.ts` 107~172행 · `features/compare/picksSaver.test.ts` 33행 (r1) | `confirmProfile(n)`·`createProfileVersion(id, rev)` 호출 — 인자가 필수라 **typecheck에서 깨짐** | a | `expectedLatest` 인자 추가(첫 확정 0 · 이후 최신). 버전 번호·오류 코드 단언은 유지 |
| `components/layout/AppHeader.test.tsx` 12행 | `/profile` 렌더 시 헤더 구성 | a | 깨지지 않아야 한다(헤더 무변경). 새 페이지가 로딩 중 예외를 내면 깨짐 — 신호 |
| `domain/profileDraft.test.ts`·`boardWarnings.test.ts` | grep에 걸렸지만 프로필 **초안** 대상 | — | 깨지지 않아야 한다(`picksSaver.test.ts`는 r1에서 위 확정 인자 행으로 옮김) |
| `components/ds/SegmentedControl` 관련(카탈로그 정렬·상세 미리보기 폭·모션 강도) | disabled 확장 | b | 옵션 `disabled` 없으면 지금과 같은 동작 — 깨지지 않아야 한다 |
| `domain/contrast.test.ts` | `ContrastCheckId`가 C-1~C-3 | a | C-4·C-5 추가, 기존 `checkPaletteContrast`는 그대로(보드) |
| 보드 AC-24·확정 테스트(`memoryCompareBoardRepository.test.ts`·`CompareBoardPage.test.tsx`의 초안 = 저장값 단언) | 저장 레코드가 `ProfileVersion`이 되면서 `profile` 대신 `base`·적용된 값 두 가지가 생김 | a·b | **초안과 비교하는 대상은 `base`**(보드 유래 값 — r1 필드 단위 규칙에서도 `base` = 보드 초안 그대로). 조정 이어받기(b)는 적용된 값만 바꾸므로 기존 단언은 `base`로 옮기면 유지된다. 적용된 값 단언은 P-AC-20·38·39 새 테스트가 맡는다 |
| `test/renderApp.tsx` | 프로필·생성 저장소 주입 인자 없음 | a | 렌더마다 store 새로 만들어 두 저장소 주입(6.3) — 기존 호출부 인자 순서는 유지(뒤에 선택 인자 추가) |

---

## 10. 설계 결정 (2026-09-26 영환님 "전부 A")

r0의 질문 9개는 모두 A로 결정됐다. Q4는 r0 원안(조정 전부 이어받기 + 캡션)이 아니라 **Jarvis 수정안(필드 단위 우선순위)**이다 — r0 원안은 보드에서 다시 고른 값을 조정이 덮어써 저장값을 믿을 수 없게 만든다(Codex r0 high).

| # | 질문 | 결정 | 반영 |
|---|---|---|---|
| Q1 | 생성기 없이 3안을 어떻게 보여 줄까 | **A** 결정적 구조안 + "구조 미리보기" 캡션 상시. B(비우기)·C(고정 fixtures) 기각 | 4.1·4.5·P-AC-21~31 |
| Q2 | 전역 조정 컨트롤 | **A** 라디오 그룹(`SegmentedControl` + 옵션 disabled 확장) | 3.4·P-AC-12·13 |
| Q3 | "대비" 조정의 뜻 | **A** 기본 AA 4.5 / 강화 7.0 두 단계, AA 미만 옵션 없음 | 3.3·3.4·P-AC-19 |
| Q4 | 버전 계보·필드 소유(TRD 4.3 개정) | **A(Jarvis 수정안)** 버전 = `base` + `adjustments`, 번호 계열 하나. 재확정은 **필드 단위 우선순위** — 보드에서 바뀐 필드는 보드 값이 이기고 겹치는 조정은 지움(대비 보정은 대상 역할 base가 바뀌면 지움), 안 바뀐 필드의 조정은 이어받음. 확정 전 보드 패널 "이어지는 조정 N개 · 지워지는 조정 M개" + 목록, 저장 결과 = 보인 결과 | 6.1·P-S25·P-AC-11·20·38·39 |
| Q5 | 사이트 목적 위치 | **A** `adjustments.purpose`(결정성 입력, TRD 4.3 필드 추가) | 3.4·6.2 |
| Q6 | 생성 요청 키 | **A** 프로필 버전 기준 `POST /profiles/{id}/versions/{v}/generate`. `project_id`는 2a-05 또는 ADR-005 Q1 후속. TRD 5·4.5 개정 대상 | 6.3 |
| Q7 | 편집기 경계 | **A** "B안으로 편집 시작"을 두고 `/studio` 자리표시로 이동 | 4.6·P-AC-29 |
| Q8 | QA용 시드 프로필 | **A** 심지 않음. QA는 보드 확정으로 진입, 테스트는 저장소 초기값 주입 | 1.1·P-S02 |
| Q9 | 역할 하나로 풀 수 없는 대비 | **A** 충돌 표시 + 대체안(밝은 카드), 역할 분리는 M2 토큰 작업 | 3.3·P-S15·P-AC-06 |

### 10.0 2a-04a1 구현 중 결정 (r4, 2026-09-26 영환님 "전부 A")

2a-04a1 REPORT 8절(`dev/active/2a-04a1/REPORT.md`) 설계 질문 5건. **A-Q1·A-Q3은 코드 변경 — 2a-04a2 첫 작업(TDD)**, A-Q2·A-Q4·A-Q5는 현행 확인.

| # | 질문 | 결정 | 반영 |
|---|---|---|---|
| A-Q1 | `ProfileSummary.baseReferenceId`의 출처(지금은 레코드 밖 store 메타) | **A** `ProfileVersion`에 `baseReferenceId` 필드로 올린다. 보드 확정은 초안 값, 되돌리기는 대상 버전 값 복사. HTTP도 버전 레코드 필드 | 6.2 · 2a-04a2 |
| A-Q2 | 6.3 ③ "보드 `confirmed`·revision 갱신"의 revision | **A** `ConfirmedRef.revision`(확정한 보드 revision) 갱신이다. 보드 자체 revision은 올리지 않는다(올리면 확정 직후 "변경됨"이 되어 S-15가 깨짐) | 6.3 |
| A-Q3 | 최신 버전으로의 `revertTo` | **A** 저장소도 거부한다(`SCHEMA_INVALID` "이미 최신 버전입니다", 새 버전 0). 화면은 이전 버전에서만 되돌리기를 보인다(P-S07) | 6.3 · P-AC-10 보강 · 2a-04a2 |
| A-Q4 | 응답 실패 뒤 끼어든 쓰기가 있어도 같은 키 재시도는 커밋된 결과 | **A** 현행 유지 — 그 요청은 실제로 커밋됐으므로 멱등 결과가 맞다. 화면은 결과 프로필로 이동하고 최신은 다음 조회에서 반영 | 6.3 |
| A-Q5 | `profileHead`가 P-B2 목록 밖 공통 증가 | **A** P-B2 목록에 추가(실측 +0.03KB) | 7 P-B2 |

### 10.0.1 2a-04a2 구현 중 결정 (r5, 2026-09-26 영환님 "1, 전부 A" · "전부 A")

근거: `dev/active/2a-04a2/REPORT.md` 9절·12.7·12.9, Codex adversarial `dev/active/2a-04a2/logs/codex-adversarial-j1~j3.txt`.

| # | 질문 | 결정 | 반영 |
|---|---|---|---|
| Q1 | A-Q3가 깨뜨린 a1 테스트 셋업(9절 표 밖) | **A** `insertOtherVersion` 헬퍼로 교체 승인(단언 번호 유지, origin 기대 `revert`→`adjust`) | 9 |
| Q2 | 선택 값 이름표 없음(`cta_placement`·`media_ratio`·`mobile_pattern`·`card_style.style`) | **A** 2a-04b에서 요소 라이브러리에 이름표 추가 | 2a-04b |
| Q3 | 이전 버전 보기 중 비교 대상 | **A(수정안)** URL 계약 우선: 쌍 = (`?v=` 또는 최신, `diff`), 버튼 이름 "vN과 비교"(Codex j1 medium) | 2 · 5.2 |
| Q4 | 되돌리기 실패 이벤트 | **A** `profile_save_failed(reason)` · `studio:profile` 이벤트 | 6.5 |
| Q5 | 조정·3안 h2와 1280 2단 | **A** 2a-04b·c에서 기능과 함께 | P-AC-08 |
| Q6 | "보정값 쓰기" 버튼 | **A** 조정 저장과 함께 2a-04b | P-AC-06 |
| Q7 | "비교 보드로"를 링크로 | **A** 이동이므로 버튼 모양 링크 | P-S02·S04 |
| Q8 | 번들 측정 목록 변경(`memoryStudio.ts`, 누락 키 가드) | **A** 승인(예산 상수 무변경) | 7 |
| Q9 | 없는 `?v=` | **A** 최신 + 글자 안내 | 2 |
| N1 | 안내 낭독 경로 | **A(병합 전 수정)** 상시 "프로필 알림" 영역으로, Callout은 role 없음(A-9, Codex j2 medium) | 2 · 5.3 |
| N2 | `?v=0`·`01` 등 | **A** "요청한 버전이 없어…" 유지 | 2 |
| N3 | 없는 `?v=` URL 정리 | **A** 정규화 안 함 | 2 |

**번들 결정(영환님 "1")**: `/compare` 첫 화면 여유 0.84KB — **2a-04b 첫 작업으로 용량 확보·실측** 후 P-S25·이어받기 구현.

### 10.1 남은 쟁점 (r1)

없음. 검토 중 나온 "되돌리기 뒤 재확정의 비교 기준"은 브리프 문구(지난 확정 버전의 base)대로 정했다 — 근거와 기각한 대안은 6.1-3, 검증은 P-AC-39 ⑥.

---

## 11. 목업과 다르게 한 부분 (ADR-003)

| # | v2 목업 (2a-04) | 결정 | 순위 근거 |
|---|---|---|---|
| M-01 | aside 제목 h2 "디자인 프로필", main h1 "생성된 3안" | h1 "디자인 프로필" + h2 5개(3.1) — 페이지 주제는 프로필, 3안은 그 하위 | 2 접근성(제목 구조) |
| M-02 | "다시 생성" 버튼 | **없음.** 새 결과는 새 버전에서만, 재시도는 실패 때만(4.5) | 1 기능(FR-GEN-03, TRD 6.2) |
| M-03 | 전역 조정 슬라이더(값 막대 + 짧은 라벨) | 라디오 그룹 + 보이는 값 + 범위 밖 이유(3.4, Q2) | 2 접근성·사용성 |
| M-04 | 현재 버전 = 점 색 | Tag 글자 "현재"(5.4) | 2 접근성(C-12) |
| M-05 | 시각 방향을 활성 FilterChip으로 | 비대화형 Tag(v2 C-11 선례) — 바꾸는 곳은 보드 | 2 사용성(거짓 행동 유도) |
| M-06 | 시각 방향 줄에 `hero: fullbleed`·`card: elevated` 키 섞음 | "구성 요소" 목록에 라벨 + 이름표, 키는 캡션 | 2 사용성 |
| M-07 | 대비 안내 = hex 한 줄("→ #6B4A2E로 보정 제안") | 역할 이름 · 수치 · 전후 견본 · "보정값 쓰기" · 충돌 판정(3.3, 1a-03 3.4 이어받음) | 1 기능(FR-PRF-02) |
| M-08 | 선택 안 = 주 색 테두리 + "선택" 배지 | + 버튼 글자 "선택됨"·`aria-pressed` | 2 접근성 |
| M-09 | 썸네일에 hex 하드코딩(`#8B5E3C`·`#2C2C2C`) | 프로필 토큰 데이터로 칠함, "구조 미리보기" 캡션 | 1 기능(프로필 반영) · 3 규칙(하드코딩 금지) |
| M-10 | "A안으로 편집 시작" 고정 · A안 미리 선택 | 미리 선택 없음, 버튼 이름이 선택을 따름, 선택 전 `aria-disabled` + 이유 | 1 기능(명시적 선택) |
| M-11 | 상단 "생성 로그" 버튼(`file` 아이콘) | 안마다 3줄 항상 + 전체 로그 펼침, 아이콘 없음 | 1 기능(FR-GEN-05) · 성능(P-B3) |
| M-12 | "프로필로 돌아가기" 버튼 | 없음 — 프로필과 3안이 한 화면. 대신 "비교 보드에서 선택 바꾸기" | 1 흐름 |
| M-13 | 결정성 캡션 "seed 4127" | + 프로필 버전 · 생성기 버전 · 카드별 결과 해시 | 1 기능(FR-GEN-03) |
| M-14 | 로딩·빈·실패·부분 실패·이전 버전·충돌·범위 밖 상태 없음 | P-S01~S24 정의 | 2 사용성(ADR-003 적용 규칙) |
| M-15 | 굵기 800(브랜드) | 700(v2 C-12 이어받음) | 2 성능 |
| M-16 | 1280 한 폭만 | 5폭 배치(5.1) | 2 반응형 |
| M-17 | 사이트 목적 입력 없음 | 조정에 "사이트 목적"(Q5) | 1 기능(R-03·R-04, ADR-005 Q2) |
| M-18 | (2a-03 보드 목업) 초안 패널에 프로필 조정 표시 없음 | "이어지는 조정 N개 · 지워지는 조정 M개" + 목록(P-S25, r1) | 1 기능(Q4=A — 보이는 초안 = 저장값) |
