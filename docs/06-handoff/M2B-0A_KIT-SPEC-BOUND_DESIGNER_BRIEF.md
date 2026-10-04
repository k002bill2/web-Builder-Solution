# M2B-0A — 킷 명세: 바깥 11변형(header 3 · hero 5 · footer 3) + 루브릭 (Designer)

- 책임 Designer / 실행 Orca + Claude Code(`--role designer`) · 보고 Jarvis · 포트 **4339**(127.0.0.1, 지금 화면 확인용) · `--max-turns` 90 · `--effort` medium · **70턴부터 REPORT 마감 우선**
- 서브에이전트 금지(429 이력) · 시작 커밋 = 이 브리프가 들어 있는 main
- **병렬 레인: M2B-0B**(Designer, 본문 12변형, 쓰기 = `docs/design/m2b/SPEC-BODY.md`·`docs/design/m2b/body/`·`dev/active/m2b-0b/`, 포트 4341). 그 경로·포트에 손대지 않는다. 공통 규약은 둘 다 **m2a SPEC 0절을 그대로 상속**하므로 서로 기다리지 않는다.
- **쓰기 허용 경로(이것만)**: `docs/design/m2b/SPEC-BOUND.md` · `docs/design/m2b/bound/`(shots·logs·시안 HTML) · `dev/active/m2b-0a/{PROGRESS,REPORT}.md`
- 계획: `docs/04-plan/M2B_PLAN.md`

## 목적
M2B-1(Developer 구현)의 입력이 될 **바깥 11변형** 명세와 변형별 **루브릭 기록**(TR-POL-04)을 만든다.

대상: header `sticky-hamburger` · `sticky-two-tier` · `transparent` / hero `split` · `center` · `grid` · `text` · `image` / footer `biz-extended-map` · `minimal` · `minimal-biz`.

## 근거 (먼저 읽기)
- **`docs/design/m2a/SPEC.md` 0절 공통 규약 전체(상속 — 다시 쓰지 않는다)** · K1-1(header) · K1-2(hero) · K1-7(footer) — 같은 유형의 이미 구현된 변형과 **차이만** 적는다.
- `docs/design/2a-05/SPEC.md` r4.8~r4.13(오버레이 · 폴백 · 내보내기 · 고정 스크립트 r4.12)
- 데이터 계약: `app/src/engine/sections/boundSections.ts`(슬롯 · 라벨) · `registry.ts` · `app/src/domain/profile.ts`(킷 토큰 입력)
- 구현된 킷: `app/src/kit/{HeaderStickyRightCta,HeroFullbleedLeft,FooterBizExtended,Media,body,text,tokens}.ts(x)` · `kit.css`
- ADR-004 개정 2(렌더 문서 JS 90 · CSS 30 — 지금 JS 80.12, 멈춤선 89.70) · TRD 4.4 · 8절 · TR-POL-04
- 시각 근거: 지금 7변형 화면(`dev/active/m2a-close-design/shots/v4-*` · `dev/active/m2a-3c/shots/c4-png-*`)

## 범위
### B1. 변형 명세 (변형마다 1절, m2a K1의 1~7 항목 그대로)
1. 구조(의미 요소 · 슬롯 배치 — 슬롯 키는 엔진 그대로, **새 슬롯 0**) 2. 반응형 **1280 · 768 · 390**(m2a 0.6 `md`·`lg` 이름으로) 3. 토큰 대응(역할·단계만, hex·px 0) · 대비 검사 대상 4. 빈 슬롯 · 상한 글자 5. 이미지 슬롯(토큰 그라디언트 1종 · 사용자 이미지) 6. 상호작용(네이티브 HTML만 · React 상태 0 · 고정 스크립트 r4.12 밖 스크립트 추가는 MQ로) 7. 모션: **이 단계는 정적 상태만**(모션 프리셋은 M2B-3) — 단, 변형별 "모션을 준다면 어디(L1/L2 후보 요소)"만 한 줄.
- 특이점 반드시 다룰 것: `header/transparent`(hero 위에 겹침 — 면 없는 글자 대비를 어떤 조합으로 보장? 겹칠 hero가 없을 때) · `header/sticky-two-tier`(2단 메뉴 390 접힘) · `hero/grid`(이미지 타일 수 · 슬롯 1개 이미지로 타일을 만드는 규칙) · `footer/biz-extended-map`(지도 = **외부 지도 요청 0** — 이미지 슬롯·정적 표현으로) · `header/sticky-hamburger`(1280에서도 메뉴 버튼 — 기존 popover 재사용).

### B2. 루브릭 기록 (TR-POL-04 · 변형마다 표 1개)
Jarvis 최소 기준 8항(Designer가 항목을 늘릴 수 있음, 줄이지 않음): ① 기능 적합(업종·목적) ② 정보 위계 ③ 3폭 반응형 ④ 접근성(랜드마크 · 헤딩 · 대비 · 포커스) ⑤ 토큰 준수(역할·단계만) ⑥ 예산 감각(JS 0 지향 · CSS 추정) ⑦ **독자성** — 특정 사이트 재현 아님(외부 사이트 이미지·문구·구체 수치 0) ⑧ **근거 3개** — 일반 웹 패턴 근거(교과서적 레이아웃 원칙 · WCAG · 내부 레퍼런스 태그/카탈로그 필드). 각 항목 PASS/주의 + 한 줄 근거.

### B3. 수용 기준 · 시각 QA
- 변형별 `KB-AC-NN`(Developer 테스트로 옮길 수 있는 관찰 문장) · M2B-1 시각 QA 대조 항목(1280 · 768 · 390).
- **예산 추정 표**: 변형별 JS·CSS 증가 L3 추정(구현된 변형과 비교) + 11변형 합계.

## 제외
- 본문 12변형(0B) · 모션 프리셋 · 폰트 · 3안 비교 · 자체 그래픽 본편 · 앱 화면 · 코드 작성.

## 규칙
- 판단 순서 ADR-003: 기능·흐름 → 사용성 → DS 일관성 → 목업. 목업에 모든 걸 맞추지 않는다.
- 브랜드(ADR-002): 킷 = 사용자 사이트. 앱 브랜드 · APFS 명칭 · `--apfs-*` 0. 앱 DS 토큰과 킷 토큰을 섞지 않는다.
- 권리: GDWEB · dbcut 접속 · 크롤링 금지. 외부 이미지·문구·수치 0.
- 대비 계산 근거 L2(기존 `contrast_calc.py` 방식). 시안이 필요하면 `docs/design/m2b/bound/mock-*.html`(킷 토큰 역할만, 외부 자원 0).
- 공통 규약을 바꿔야 하면 본문에 쓰지 말고 **MQ-N**(Jarvis가 SPEC에 기록).
- 커밋 `git commit -- <쓰기 허용 경로>`. 로컬 커밋만. push · 병합 · 삭제 금지. 서버는 127.0.0.1:4339 · 끝날 때 자기 PID 전부 종료 + `lsof -nP -iTCP:4339 -sTCP:LISTEN` 결과 0을 REPORT에.
- 턴 남으면 Codex 적대적 검토 1회(원문 `docs/design/m2b/bound/logs/`).
- PROGRESS(수신 기록 · 변형마다 갱신) · REPORT(산출물 · 루브릭 요약 · MQ · 예산 추정 · 남은 위험 · 서버) — **변형 4개마다 커밋**.

## 수용 기준
1. 11변형 모두 B1 1~7 채움(해당 없음은 사유). hex·px 0(대비 근거 제외). React 상태 의존 0. 외부 요청 0.
2. 11개 루브릭 표(8항 이상).
3. `KB-AC` 목록 · 3폭 시각 QA 항목 · 예산 추정 표 · MQ 목록.
