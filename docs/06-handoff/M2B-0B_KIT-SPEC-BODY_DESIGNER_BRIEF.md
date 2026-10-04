# M2B-0B — 킷 명세: 본문 12변형 + 루브릭 (Designer)

- 책임 Designer / 실행 Orca + Claude Code(`--role designer`) · 보고 Jarvis · 포트 **4341**(127.0.0.1, 지금 화면 확인용) · `--max-turns` 100 · `--effort` medium · **80턴부터 REPORT 마감 우선**
- 서브에이전트 금지(429 이력) · 시작 커밋 = 이 브리프가 들어 있는 main
- **병렬 레인: M2B-0A**(Designer, 바깥 11변형, 쓰기 = `docs/design/m2b/SPEC-BOUND.md`·`docs/design/m2b/bound/`·`dev/active/m2b-0a/`, 포트 4339). 그 경로·포트에 손대지 않는다. 공통 규약은 둘 다 **m2a SPEC 0절을 그대로 상속**한다.
- **쓰기 허용 경로(이것만)**: `docs/design/m2b/SPEC-BODY.md` · `docs/design/m2b/body/`(shots·logs·시안 HTML) · `dev/active/m2b-0b/{PROGRESS,REPORT}.md`
- 계획: `docs/04-plan/M2B_PLAN.md`

## 목적
M2B-2(Developer 구현)의 입력이 될 **본문 12변형** 명세와 변형별 **루브릭 기록**(TR-POL-04)을 만든다.

대상: about `text` / services `list` · `cards-2` · `cards-masonry` / portfolio `grid-3` · `masonry` · `grid-2` / statistics `stats-3` / testimonials `quotes-2` / pricing `tiers-2` / contact `booking` / cta-band `banner`.

## 근거 (먼저 읽기)
- **`docs/design/m2a/SPEC.md` 0절 공통 규약 전체(상속 — 다시 쓰지 않는다)** · K1-3(about/story) · K1-4(services/cards-3) · K1-5(faq) · K1-6(contact/form) · 2절 K2(문의 폼 정적 동작 A안 — `contact/booking`도 같은 원칙) — 형제 변형과 **차이만** 적는다.
- `docs/design/2a-05/SPEC.md` r4.8~r4.13 · r4.6 A3-Q3(그리드 축 변형은 같은 유형 3칸 스키마 재사용)
- 데이터 계약: `app/src/engine/sections/bodySections.ts`(슬롯 · 라벨 · `reservation`) · `registry.ts` · `app/src/domain/profile.ts`
- 구현된 킷: `app/src/kit/{AboutStory,ServicesCards3,FaqAccordion,ContactForm,Media,body,text,tokens}.ts(x)` · `kit.css`
- ADR-004 개정 2(렌더 문서 JS 90 · CSS 30 — 지금 JS 80.12, 멈춤선 89.70) · TRD 4.4 · 8절 · TR-POL-04
- 시각 근거: `dev/active/m2a-close-design/shots/v4-*` · `dev/active/m2a-3c/shots/c4-png-*`(지금 Portfolio · Testimonials는 폴백)

## 범위
### C1. 변형 명세 (변형마다 1절, m2a K1의 1~7 항목 그대로)
1. 구조(새 슬롯 0) 2. 반응형 **1280 · 768 · 390** 3. 토큰 대응(역할·단계만) · 대비 검사 대상 4. 빈 슬롯 · 상한 글자 5. 이미지 슬롯 6. 상호작용(네이티브 HTML만 · React 상태 0) 7. 모션: **정적 상태만**(모션 프리셋 M2B-3) — "모션 후보 요소" 한 줄.
- 특이점 반드시 다룰 것: `services/cards-masonry`·`portfolio/masonry`(**CSS만**으로 벽돌형 — `columns` 등, 읽기 순서 = 문서 순서 유지 · JS 배치 0) · `services/list`(`items` 한 칸을 `·`로 나누는 규칙 — m2a 0.10 나누기 규칙과 정합) · `statistics/stats-3`(수치 글자 · 390 배치) · `pricing/tiers-2`(가격 슬롯이 글자 "문의"일 때 · 강조 요금제 없음 = 동등) · `contact/booking`(정적 HTML 비활성 폼 + 안내 — K2 A안 상속, 예약 고유 필드 이름표는 킷 고정 문구로 전부 나열) · `cta-band/banner`(CTA 대상 규칙 m2a 0.10 상속) · `testimonials/quotes-2`(`blockquote`·`cite` 의미 구조).

### C2. 루브릭 기록 (TR-POL-04 · 변형마다 표 1개)
Jarvis 최소 기준 8항(늘릴 수 있음, 줄이지 않음): ① 기능 적합 ② 정보 위계 ③ 3폭 반응형 ④ 접근성 ⑤ 토큰 준수 ⑥ 예산 감각 ⑦ **독자성**(특정 사이트 재현 아님 · 외부 이미지·문구·수치 0) ⑧ **근거 3개**(일반 웹 패턴 근거 · WCAG · 내부 레퍼런스 태그). 각 항목 PASS/주의 + 한 줄 근거.

### C3. 수용 기준 · 시각 QA
- 변형별 `KD-AC-NN` · M2B-2 시각 QA 대조 항목(1280 · 768 · 390).
- **예산 추정 표**: 변형별 JS·CSS 증가 L3 추정 + 12변형 합계(형제 변형의 컴포넌트 공유 가능성 표시 — 예: cards-2 = cards-3의 열 수 매개변수).

## 제외
- 바깥 11변형(0A) · 모션 프리셋 · 폰트 · 3안 비교 · 자체 그래픽 본편 · 앱 화면 · 코드 작성.

## 규칙
- 판단 순서 ADR-003. 브랜드(ADR-002): 앱 브랜드 · APFS 명칭 · `--apfs-*` 0, 앱 DS 토큰과 킷 토큰 분리.
- 권리: GDWEB · dbcut 접속 · 크롤링 금지. 외부 이미지·문구·수치 0.
- 대비 계산 근거 L2. 시안은 `docs/design/m2b/body/mock-*.html`(외부 자원 0).
- 공통 규약 변경이 필요하면 **MQ-N**(Jarvis 기록).
- 커밋 `git commit -- <쓰기 허용 경로>`. 로컬 커밋만. push · 병합 · 삭제 금지. 서버는 127.0.0.1:4341 · 끝날 때 자기 PID 전부 종료 + `lsof -nP -iTCP:4341 -sTCP:LISTEN` 결과 0을 REPORT에.
- 턴 남으면 Codex 적대적 검토 1회(원문 `docs/design/m2b/body/logs/`).
- PROGRESS · REPORT(산출물 · 루브릭 요약 · MQ · 예산 추정 · 남은 위험 · 서버) — **변형 4개마다 커밋**.

## 수용 기준
1. 12변형 모두 C1 1~7 채움(해당 없음은 사유). hex·px 0(대비 근거 제외). React 상태 의존 0 · JS 배치 0. 외부 요청 0.
2. 12개 루브릭 표(8항 이상).
3. `KD-AC` 목록 · 3폭 시각 QA 항목 · 예산 추정 표 · MQ 목록.
