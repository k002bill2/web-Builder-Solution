# M2c 이미지 — 실행 계획 (Designer M2C-0 · 2026-10-05)

- 상위: `docs/04-plan/DEVELOPMENT_PLAN.md` 19행(M2c · 1주 추정 · 종료 게이트 F2 시안 등급) · 명세 `docs/design/m2c/SPEC.md` r0 · 결정 `docs/design/m2c/MQ-M2C.md`
- 출발점(base `92f8e2f` — M2b 완료): 업로드 경로 0 · 이미지 보관소 0 · 내보내기 이미지 0 · 빈 슬롯 = 그라디언트 [L1 SPEC 0절]. 예산 `/studio` 진입 127.36/128(멈춤선 127.70 · 감지선 +0.03) · 렌더 JS 83.03/89.70 · CSS 8.75/30.
- 착수 조건: MQ-C1·C2·C4·C6 답(또는 "전부 ★"). ★와 다른 답이면 Designer가 SPEC 해당 절을 r1로 고친 뒤 착수.

## 1. 레인 (각 레인 = 산출물 1개 · 50턴 안 목표)

| 레인 | 역할 | 산출물(쓰기 경로) | 수용 기준 | 선행 | 병렬 | 시간 [추정] |
|---|---|---|---|---|---|---|
| **M2C-1** 변환기 | Developer | `imageIngest` 순수 모듈 — 검증 V1~V6 · 헤더 파서 · 폭 사다리 · 포맷 결정 · EXIF/방향 · 자체 제작 fixture 생성 스크립트 (`app/src/features/studio/images/ingest/**` 신규만) | IMG-AC-01~07 · 10 | MQ 답 | M2C-2 | 1~1.5일 |
| **M2C-2** 렌더 쪽 | Developer | 자체 그래픽 SVG · 프로토콜 `images` 모양 · masonry 원본 비율 · map `contain` (`app/src/kit/**` · `app/src/render/**`) | IMG-AC-17~22 · 렌더 예산 | MQ 답 | M2C-1 | 1일 |
| **M2C-3** 슬롯 UI·보관소 | Developer | 진입 버튼 · `ImageSlotPanel`(lazy) · 보관소(탭 메모리 · 참조 집합 해제 · 한도) · 캔버스 연결 (`app/src/components/studio/**` · `app/src/features/studio/images/store/**` · `data/` 필요 시) | IMG-AC-08·09·11~16 · `/studio` 진입 ≤ +0.03 | M2C-1 · M2C-2 병합 | — | 1.5~2일 |
| **M2C-4** 산출물 동봉 | Developer | 생성기 `readImage` 주입 · 정적 HTML·PNG 이미지 · 잃은 이미지 문구 · 크기 표시 · F2 캡션 (`app/src/features/studio/staticHtml/**` · `png/**` · `exportFlow` · `canvasCaption`) | IMG-AC-23~29 | M2C-3 병합 | — | 1일 |
| **M2C-5** QA | QA | QB-1~12 · 시각 회귀 기준선 재생성(SVG 변경 = 의도된 변경) · 예산 로그 (`dev/active/m2c-5/` · 기준선 파일) | QB 전부 · B-M2B-09 한계 명시 | M2C-4 병합 | — | 0.5~1일 |

- 합계 **5~6.5 작업일 [추정]** — 계획 1주(5일)보다 0~1.5일 길 수 있다. 근거: 변환기(헤더 파서 3형식)와 보관소 한도 규칙(2a-05 5.9 r2 "계산 뒤 비움")이 단순 UI보다 테스트가 많다. MQ-C2 B(IndexedDB)면 **+0.5~1일**, MQ-C7 B면 **+2~3일**.
- 동시 작업자 2개 상한(이 프로젝트 429 이력) · 서브에이전트 금지 유지 → 병렬은 M2C-1 ∥ M2C-2만.

## 2. 순서·의존성
```
MQ 답 ──┬─ M2C-1 변환기 ──┐
        └─ M2C-2 렌더 쪽 ──┴─ M2C-3 슬롯 UI·보관소 ── M2C-4 산출물 동봉 ── M2C-5 QA
```
- M2C-1 ∥ M2C-2: 쓰기 경로가 겹치지 않는다(`features/studio/images/ingest/**` vs `kit/**`·`render/**`). 공유 계약은 SPEC 3절 `{blob,width,height}` 한 줄 — M2C-2가 `render/protocol.ts`에 타입을 두고 M2C-3가 import.
- M2C-1 공개 API(M2C-3가 쓸 것 — SPEC 2.3~2.6에서 고정):
  `ingestImage(file: File, deps?) → Promise<{ ok: true; image: { variants: Partial<Record<640|1280|1920|number, Blob>>; width; height; format: "webp"|"jpeg"|"png"; bytes } } | { ok: false; code: "TYPE_MISMATCH"|"TOO_LARGE"|"TOO_MANY_PIXELS"|"DECODE_FAILED"; detail? }>`
- M2C-4가 `ExportGenerator` 계약을 바꿔야 한다고 판단하면 멈추고 보고(SPEC 5.1 — 팩토리 주입이 기본안).

## 3. 레인 공통 규칙
- TDD: 실패 테스트 먼저 · RED 로그를 `dev/active/<lane>/logs/`에.
- **예산 멈춤**: 레인 시작 때 시제품 1개로 `npm run build` 실측 → 레인 끝 예상이 `/studio` 진입 기준선 +0.03 또는 127.70, 렌더 JS 89.70을 넘으면 **구현 전에 멈추고 보고**. 상향 요청 금지(ADR-004 개정 4 결정 3 — 구조 점검 레인 선행).
- fixture는 자체 제작만(캔버스 패턴 + 직접 붙인 EXIF·방향 태그). 외부 스톡·크롤링·실사진 0.
- 깨지는 테스트는 SPEC 10절 목록 안에서만 기대값 개정 — 목록 밖이면 멈추고 보고.
- 새 의존성 0(AVIF·이미지 라이브러리 포함). 필요해 보이면 MQ로.
- 브라우저 검증은 ego-browser / aside만, **앱 안 클릭으로만 이동**. 서버는 4337/4339 loopback · 자기 PID 종료 · main 5480 무접촉.

## 4. QA 게이트 (레인마다)
1. `cd app && npm run typecheck` · `npm run lint` · `npm test -- --run` · `npm run build`(예산 포함) — 4개 통과(CLAUDE.md 완료 기준).
2. 해당 IMG-AC 표의 각 줄을 REPORT에 테스트 이름과 함께 매핑.
3. Codex review(`--scope branch --base <분기점>`) 1~2라운드 · 실제 완료 결과만 기록.
4. M2C-5 QA PASS = **F2 시안 등급** 종료 게이트(계획 19행): 모든 섹션 실렌더 + 폰트 + 모션(M2b) + 이미지 슬롯이 사용자 이미지 또는 자체 그래픽 + 정적 HTML·PNG에 같은 이미지.

## 5. 위험
| 위험 | 영향 | 대응 |
|---|---|---|
| `/studio` 진입 여유 0.34KB(멈춤선) · 감지선 0.03 | M2C-3·4 멈춤 | SPEC 7절 배치(버튼만 진입) · 대안 순서 ①~③ |
| Safari·Firefox 실측 불가(B-M2B-09) | WebP 대체·방향·캔버스 한도 실기기 미확인 | 모의 단위 테스트 + BACKLOG [확인 필요] |
| 이미지 포함 PNG 높이 비결정 | M2B-D1 회귀 | 이미지 `decode()` 뒤 rects(SPEC 5.3) · 5회 반복 QB-9 |
| HTML 4~5MB | 메일 첨부 실패 | MQ-C3 · zip M4 |
| 그라디언트 → SVG 시각 회귀 대량 변경 | 기준선 오판 | M2C-5에서 "의도된 변경"으로 기준선 재생성 기록 |
