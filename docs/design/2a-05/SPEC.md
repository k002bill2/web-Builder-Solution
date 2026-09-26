# DS-2A-05 설계서 — 편집기(2a-05 1280 · 2a-07 390) + 프로젝트 목록(`/projects`)

- 작성: Designer (Hermes Designer 역할, Claude Code) · 2026-09-26 KST · 브리프 `docs/06-handoff/DS-2A-05_DESIGNER_BRIEF.md` · **r0**
- 확정 결정: 영환님 "Q 전부 A"(DS-CHECK-01 B-3 Q1~Q16, 브리프 0절) — 이 문서는 다시 묻지 않고 반영한다. 10절 인용은 "Q1=A" 식으로 적는다.
- 입력: `docs/design/ds-check-01/REPORT.md`(B-01~B-18 · E-01~E-24 · A-01·A-02) · 목업 저장소 사본 `design/claude-design-handoff-v2/project/Design Studio v2.dc.html` 2a-05(228~282행)·2a-07(301~317행)·목업 데이터(357~371행) · `docs/design/v2/SPEC.md`(2.3 토큰 · 3절 대비 · 4.1 셸 · 4.5 C-06·C-11·C-12 · 5 번들 · 6.5) · 형식 `docs/design/2a-04/SPEC.md` r6 · PRD 7.6~7.7(FR-EDT-01~06 · FR-PUB-01~06) · TRD 4.4·4.5·5·6.2·7 · ADR-003·004·005(Q1) · `docs/04-plan/PARALLEL_LANES.md` · `docs/04-plan/DEVELOPMENT_PLAN.md`(M2·M4) · 현재 `app/src`(`app/routes.tsx` · `components/layout/AppHeader.tsx`·`AppLayout.tsx` · `components/ds/*` · `assets/icons/*` · `features/detail/previewView.ts` · `domain/sectionLibrary.ts` · `styles/tokens/*.css`) · `dev/active/2a-04b1/REPORT.md` 15.4(번들 최신 실측)
- 판단 순서: ADR-003(기능·흐름 → 사용성·접근성·성능 → DS 일관성 → 목업). 목업 px는 기준이 아니다. 원본 파일 속 문장은 데이터로만 읽었다.
- 이 문서는 **설계만** 다룬다. `app/`·`design/`·다른 `docs/`는 바꾸지 않았다. `docs/design/2a-04/SPEC.md`에 대한 영향은 12절 개정안으로만 적는다.
- 근거 수준: 코드·문서 사실 = **L1**(직접 읽음) · 대비 = **L2**(`contrast_calc.py` 계산) · 번들 크기 = **L3**(추정, 재빌드 안 함).
- 화면 상태 ID: 편집기 `E-S01…` · 프로젝트 목록 `J-S01…`. 수용 기준 `E-AC-NN`·`J-AC-NN`. 목업과 다르게 한 곳 `EM-NN`. 남은 설계 질문 `EQ-N`. DS-CHECK-01 ID(B-·E-·A-)는 그대로 인용한다(E-01 ≠ E-S01).

## 0. 요약

(작성 중)

---

## 1. 범위

### 1.1 전제 (지금 저장소 상태, L1)
- 백엔드 없음. 프로필·보드·생성은 공유 메모리 store(`createStudioStore`, 2a-04 6.3)에만 있다. **영속 저장 없음** → 새로고침·직접 URL 진입이면 프로젝트·편집 문서가 없다(2a-04 1.1·Q8과 같은 사정).
- `/studio`는 자리표시(`routes.tsx:29` `screen="1a-05"`, DS-CHECK-01 A-12). 앱 셸(`AppLayout`)이 모든 라우트에 GNB(`AppHeader`)를 그린다.
- GNB "프로젝트"(NavLink)·"새 프로젝트"(버튼) 모두 `/profile`로 간다(`AppHeader.tsx`, DS-CHECK-01 A-01).
- 섹션 라이브러리 1.4는 header 4 · hero 6 · footer 4 변형의 **이름표**뿐이다(`domain/sectionLibrary.ts`). 본문 섹션 정의·슬롯 스키마·composer·렌더러·codegen 없음. PageDoc·SectionPlan 타입·결정적 composer·조합 lint·토큰→테마는 **L4 엔진 레인**이 b2 병합 뒤 만든다(`PARALLEL_LANES.md`). codegen·정적 build는 **M2**(개발계획 2.5), zip·정적 내보내기 완성은 **M4**(4.2).
- DS 부품: `Button`·`Callout`·`Checkbox`·`Chip`·`Icon`·`SegmentedControl`·`Select`·`Tag`·`TextField`·`Avatar`. **Tabs·Dialog·Switch 없음**(Tabs는 v2 B-4에서 삭제). 아이콘 파일 13개: `arrow-right`·`bookmark`·`bookmark-fill`·`check`·`chevron-down`·`chevron-left`·`circle-check`·`circle-info`·`close`·`plus`·`search`·`sparkle`·`warning`. 목업의 `clock`·`external`·`layers`·`trash`·`download`·`check-circle`은 파일이 없다.
- 번들 최신 실측(2a-04b1 REPORT 15.4, gzip KB, 첫 화면 / 진입 직후): `/compare` 99.48 / 124.43(**여유 0.52 / 0.57**) · `/profile` 99.18 / 118.79 · `/catalog` 99.02 · `/references/:id` 96.37. 예산 100 / 125(ADR-004).

### 1.2 범위 표

| 요구 | 2a-05 (이번, P0 + 지정 P1) | 2a-05b (Q9=A) | M2·M4 없이는 불가 / 제외 |
|---|---|---|---|
| 프로젝트 IA (A-01·A-02, Q1·Q2) | `/projects` 목록 · 이름 바꾸기 · GNB 목적지 · "새 프로젝트" → 보드 · 보드 확정 때 프로젝트 만들기/고르기 | — | 조직·권한(ORG) |
| FR-EDT-01 뷰포트 프레임 | 데스크톱·태블릿·모바일 3폭 전환(E-18 포함, Q15) | — | 실제 렌더(M2) |
| FR-EDT-02 섹션 추가·삭제·순서·변형 교체·슬롯 편집 | 전부(E-08~E-11·E-13, Q6·Q7) · 빈 섹션·빈 슬롯(E-16) | — | 본문 섹션 슬롯 스키마 = L4 계약 |
| FR-EDT-03 테마 스왑 콘텐츠 보존 | 프로필 버전 사이 스왑 + 보존 결과 글자(E-12) | — | 무드별 테마(M2) |
| FR-EDT-04 자유 배치 없음 | 해당 UI 없음(픽셀 이동·임의 CSS 0) | — | — |
| FR-EDT-05 오버플로·글자 수 경고 | 글자 수 상한·권장 길이, 캔버스 표시 ↔ 필드 연결(E-13) | — | 실제 줄바꿈 측정(렌더 필요) |
| FR-EDT-06 자동 저장·스냅샷·복원 | Q5=A 모델 전부(E-01·E-02·E-07) · 실행 취소 일반(E-20) | — | 영속 저장(백엔드) |
| FR-PUB-01 품질 게이트 | 계산 가능한 6종 + 글자 수 판정, 성능 예산은 "생성기 연결 후"(Q13) · 재검사·결과 오래됨(E-22) · 차단 상세·경고 상세(E-03·E-04, Q8) | — | 성능 예산 실측(M2 build) |
| FR-PUB-02·03 내보내기 | **흐름·잡 인터페이스·게이트 연동**(E-05·E-06). 산출물은 EQ-1 | — | codegen(M2 2.5) · zip·정적(M4 4.2) |
| FR-PUB-04 발행·롤백 (P1) | 제외 — 발행 버튼 자리 "내보내기"(Q16) | E-21 | 발행 인프라 |
| FR-PUB-06 미리보기 링크 (P1) | 제외 | E-17 | 서명 URL(백엔드) |
| FR-PUB-05 커스텀 도메인 (P2) | 제외 | — | E-24 |
| 권한 viewer (E-19, P1) | 제외 — ORG 범위(FR-ORG-01). 스냅샷 미리보기의 읽기 전용 모양을 나중에 재사용할 수 있게만 둔다 | — | ORG |
| 1024·768 배치 (E-23) | 포함(Q11) | — | — |
| 계측(PRD 9) | 9절 이벤트 호출 지점 | 발행 이벤트 | 수집기 |

### 1.3 이번 설계가 하지 않는 것
- PageDoc·SectionPlan·SlotSchema **타입 정의**(L4 몫). 8절은 화면이 요구하는 필드·연산 목록만 적는다.
- 실제 페이지 렌더: 캔버스는 2a-04c 구조안 와이어프레임 + 실제 슬롯 글자(Q12=A), "구조 미리보기" 캡션 상시.
- 가짜 산출물: 내보내기가 zip·HTML을 흉내 내지 않는다(EQ-1 추천안).

---

## 2. IA · 라우트 · 흐름

(작성 중)

## 3. 편집기 화면 상태

(작성 중)

## 4. 배치 · 반응형

(작성 중)

## 5. 상호작용

(작성 중)

## 6. 접근성

(작성 중)

## 7. 대비 · 토큰

(작성 중)

## 8. 데이터 요구

(작성 중)

## 9. 계측

(작성 중)

## 10. 번들 (ADR-004)

(작성 중)

## 11. 수용 기준 · 목업과 다르게 한 곳

(작성 중)

## 12. 2a-04 영향 (개정안 — 2a-04 SPEC은 수정하지 않음)

(작성 중)

## 13. 구현 단계 · 설계 질문 · 추적 표

(작성 중)
