# M2B-1 — 바깥 11변형 실렌더 (Developer · 1a hero 5 → 1b header 3 + footer 3)

- 책임 Developer / 실행 Orca + Claude Code · 보고 Jarvis · 포트 4337(정적 HTML 확인용 보조 4339) · `--effort` medium · 서브에이전트 금지(429 이력)
- **두 레인 순차**(킷 공유 파일 `app/src/kit/{registry,types,text}.ts`·`kit.css` · `header/transparent`의 `heroTop`이 hero 변형을 읽음):
  - **M2B-1a = hero 5변형**(`split` · `center` · `grid` · `text` · `image`) · `--max-turns` 100 · **80턴부터 REPORT 마감 우선** · 기록 `dev/active/m2b-1a/`
  - **M2B-1b = header 3 + footer 3**(`sticky-hamburger` · `sticky-two-tier` · `transparent` / `biz-extended-map` · `minimal` · `minimal-biz`) + SPEC-BOUND 0.2 D-1~D-3 · `--max-turns` 100 · 80턴부터 REPORT · 기록 `dev/active/m2b-1b/` — **1a 병합 뒤 기동**
- 시작 커밋 = 기동 시점 main(Jarvis 기록). 영환님 ★A(2026-10-04 — MQ 13건 잠정안 일괄 승인)

## 근거 (정본)
- **`docs/design/m2b/SPEC-BOUND.md`** 전체 — 0절(상속 · D-1~D-4 · 공통 선택자 규칙) · B-1~B-11 · 4.1 KB-AC 01~35 · 4.2 QB-1~14 · 4.3 예산 · 끝 "Jarvis 결정 기록"(MQ-B1~6)
- `docs/design/m2a/SPEC.md` 0절(공통 규약) · K1-1/K1-2/K1-7 · K-AC · `docs/design/2a-05/SPEC.md` r4.8~r4.13
- `docs/decisions/ADR-004-performance-budgets.md` 개정 2·4 · `docs/04-plan/M2B_PLAN.md`
- 구현 기준: `app/src/kit/{HeaderStickyRightCta,HeroFullbleedLeft,FooterBizExtended,Media,body,text,tokens,types,registry}.ts(x)` · `kit.css` · `features/studio/staticHtml/staticMarkup.ts`(`KEPT_DATA`)
- 이전 레인 방식: `dev/active/m2a-2a/`·`m2a-2b/`(gate.sh · shots 스크립트 · REPORT 형식)

## 공통 단계 (레인마다 같은 틀 · 단계 = RED→GREEN → gate.sh exit 0 → 커밋 · REPORT 같은 커밋)
- **P0 수신 · 골격**: PROGRESS 수신 기록 · REPORT 골격(1 커밋 표 · 2 변형별 판정 · 3 번들 표 · 4 SPEC 차이 · 5 시각 QA 캡처 · 6 Codex · 7 남은 위험 · 8 서버) · `gate.sh`(이전 레인 것 복사 · 실패 시 exit 1).
- **P1 예산 선행 실측**: 변형 1개 시제품(1a = `grid` · 1b = `sticky-two-tier` — 가장 큼)으로 렌더 문서 JS·CSS · `/studio` 진입 증가를 잰다. 레인 끝 예상치 = 시제품 증가 × 변형 수(공유분 감안 근거 기록). **렌더 JS 끝 예상 > 89.70 또는 `/studio` 진입 증가 > 0.03이면 구현 전에 멈추고 보고.** SPEC-BOUND 4.3 추정과 대조.
- **P2~ 변형 구현**: 변형 1개(또는 공유 컴포넌트 묶음) = 커밋 1개. 각 변형 = SPEC 절 B1 1~7 · 해당 KB-AC [U]/[G] 테스트 RED 먼저 · `KIT_REGISTRY` 등록 · 폴백 표식 0 확인.
- **브라우저 판정 [B]·[V]**: 127.0.0.1:4337에서 해당 QB 항목 1280 · 768 · 390 캡처(`shots/qb-<번호>-<폭>.png`) · KB-AC-31(상한 글자 + 200% 넘침 0) · KB-AC-34(대비) · KB-AC-35(정적 HTML에서 선택자 유지) — **브라우저 단계 전에 REPORT 먼저 갱신.**
- **마감**: 전체 vitest는 Jarvis가 3회(레인은 gate 표적·가드만). Codex `review --scope branch --base <시작 커밋>` 1회(`logs/codex.txt`, P1만 수정) · REPORT 마감 · 서버 0.

## 레인별 범위
### M2B-1a (hero 5)
- SPEC-BOUND B-4 `split` · B-5 `center` · B-6 `grid` · B-7 `text` · B-8 `image` · KB-AC-10~22 · 공통 KB-AC-30~35(hero 몫) · QB-5~9 · QB-12(톤별 부제) · QB-13(hero 몫).
- `HeroFullbleedLeft`와 공유할 수 있는 부분(카피 블록 · CTA 대상 · Media)은 공유하고 근거를 REPORT 4절에.
- 제외: header·footer · D-1(`heroTop`)은 1b(단, 1b가 읽을 hero 맨 위 면 정보가 SPEC B-3 표와 맞는지 hero 쪽 사실만 REPORT 7절에 메모).

### M2B-1b (header 3 + footer 3)
- SPEC-BOUND D-1(`heroTop`) · D-2(변형 클래스) · D-3(`:has()` 1줄, MQ-B5) · B-1~B-3 · B-9~B-11 · KB-AC-01~09 · 23~29 · 공통 30~35 · QB-1~4 · 10 · 11 · 13 · 14.
- `header/transparent` = 겹침 없는 면 이음 · 비고정(MQ-B1). `biz-extended-map` 지도 = 이미지 슬롯·그라디언트 · **외부 지도 요청 0**.
- r4.12 고정 스크립트 바이트 불변 — 세 header 시트가 정적 HTML에서 스크립트 추가 없이 동작(KB-AC-32 · QB-14).

## 번들 (ADR-004 개정 2·4 · 상향 없음)
- 렌더 문서 JS 멈춤선 **89.70**(지금 80.12) · CSS ≤ 30. `/studio` 진입 ≤ **127.70**(지금 127.38) — 킷 코드는 렌더 문서에만, 앱 진입 증가 ±0.03 안. 그 밖 화면 ±0.03.
- 렌더 문서 가드(앱 DS · 엔진 문서 연산 · 게이트 · zod 0) 유지.

## 공통 규칙
- 판단 순서 ADR-003. SPEC과 다르게 한 곳은 REPORT 4절 한 줄 사유. SPEC 공백은 멈추지 말고 가장 보수적인 해석 + REPORT 7절.
- TDD RED→GREEN(RED 로그 `logs/*-red.txt` 커밋). 단언 약화·skip 금지. **새 의존성·아이콘 0.** 엔진 계약(슬롯 · `SectionDefinition` · `PageDoc`) 변경 0 · 새 슬롯 0. 킷에 React 상태·이벤트 핸들러 0(KB-AC-30). `allow-same-origin` 금지.
- 스타일 선택자 = 정적 HTML에 남는 것만(`class` · `data-tone` · `data-kit` · `data-always` · `data-site-root`) — `data-section`·`data-surface`·`data-slot`은 검사 전용(SPEC-BOUND 0.2).
- `design/` · `docs/design/` · `docs/decisions/` 수정 금지. fable 무접촉. `git commit -- <경로>`. gate.sh exit 0 확인 후에만 커밋.
- 로컬 커밋만. **push · 병합 · 삭제 금지.** 서버는 4337(필요하면 4339), 끝날 때 **자기가 띄운 서버 PID 전부 종료** + `lsof -nP -iTCP:4337 -sTCP:LISTEN`·`:4339` 결과 0을 REPORT 8절에. 샌드박스 iframe fullPage 캡처 금지(`scrollIntoView` 뒤 viewport). 캡처 도구 시간 초과면 1장당 재시도 2회 → Chrome headless `--screenshot`(390·768은 해당 폭 iframe 감싸기).

## 수용 기준 (레인마다)
1. 대상 변형 전부 실렌더 · 폴백 표식 0 · 해당 KB-AC 판정 표(REPORT 2절, PASS/FAIL/미판정 + 근거).
2. P1 실측 + 최종 번들 표(렌더 JS ≤ 89.70 · `/studio` 진입 ±0.03 · 그 밖 ±0.03).
3. 해당 QB 캡처 3폭.
4. Codex P1 0 · REPORT 자리표시 0 · 서버 0.
