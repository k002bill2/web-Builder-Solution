# Designer 핸드오프 — DS-A11Y-01: 글자 대비 토큰 정정 설계

- 작성: Jarvis · 2026-09-26 KST · 영환님 Slack 선택 1(03b 병합 후 대비 결함을 별도 작업으로)
- 책임 역할: Designer / 실행 환경: Orca + Claude Code (`--role designer`) · 작업 공간 `ds-a11y-01`(main `ec43225` 기준)
- 성격: **설계 문서만.** 제품 코드(`app/`)·`design/` 수정 금지. 산출물은 `docs/design/a11y-01/`에만, 로컬 커밋, push 금지
- 턴 예산 **40** · 30턴을 넘기면 새 작업을 멈추고 SPEC을 먼저 커밋
- 판단 기준: ADR-003(기능 → 사용성·접근성 → 디자인 시스템 일관성 → 목업). WCAG 2.2 AA — 본문 4.5:1, 큰 글자(18.66px bold / 24px) 3:1, UI·아이콘 3:1

## 1. 배경 — QA-1A-03 결함 (`docs/qa/1a-03/REPORT.md` 1·3절)
| ID | 심각도 | 요약 | 실측 |
|---|---|---|---|
| D-QA01 | P2 | 하단 요약 바 "초안 보기" 버튼 글자가 어두운 바 위에서 밝은 면용 토큰을 씀 (`components/compare/DraftSummaryBar.tsx`) | `#171719` on `#323233` = 1.39:1 |
| D-QA02 | P2 | `--label-alternative`(`rgba(55,56,60,0.61)`, `styles/tokens/colors.css`) 글자 대비 미달. "기본값" 라벨·업종·흐린 셀 | 흰 배경 3.67:1, `#f7f7f8` 위 ≈3.57:1 |
| D-QA03 | P2 | 오류 문구 `--status-negative`(`--red-50` `#ff4242`) 글자 대비 미달 | `#f7f7f8` 위 3.21:1 |
| D-QA04 | P3 | "이 레퍼런스로 전부 선택" 6개 접근 이름 동일 | — |
| D-QA06 | P3 | 상세 "비교 추가" 뒤 "비교 보드에 담았습니다 · 보드 열기" 안내 없음(1a-03 SPEC 1.1) | — |

Jarvis 확인: `text-label-alternative`를 쓰는 비테스트 `.tsx`가 **20개** — 카탈로그·상세·비교 보드 공통 문제. 03b 이전부터 있던 토큰 값 문제다.

## 2. 설계 과제
1. **토큰 인벤토리**: `app/src/styles/tokens/colors.css`의 글자·상태 토큰(`--label-*`, `--status-*`, `--on-*`)과 이를 쓰는 곳(`grep -rn "label-alternative\|status-negative\|label-assistive" app/src`)을 표로. 각 토큰이 실제로 놓이는 배경(흰 면, `--background-alternative` 계열 `#f7f7f8`, 표·카드 면, 역상 바 `--surface-inverse`)별 대비를 계산
2. **새 값 제안**: 위 배경 전부에서 본문 4.5:1 이상인 `--label-alternative` 값. 위계(normal > neutral > alternative > assistive)가 눈에 보이게 유지되는지 근거 제시. 다크 테마 블록(`colors.css` 170행대)도 같은 기준으로
3. **오류·상태 글자**: `--status-negative`를 글자에 쓰는 곳을 분리할지(예: 글자 전용 토큰 추가 vs 값 조정) 결정. 아이콘·테두리(3:1)와 글자(4.5:1) 기준을 구분
4. **`--label-assistive`**: placeholder·힌트 용도 — 현재 사용처가 정보 전달용 글자인지 점검하고, 정보 전달이면 대체 토큰 지정(placeholder 자체는 WCAG 필수 아님을 명시)
5. **역상 면 규칙**: `--surface-inverse` 위 버튼·링크는 어떤 토큰 쌍을 쓰는지 규칙화(D-QA01 재발 방지)
6. **D-QA04·D-QA06 문구**: 접근 이름 형식("<열 문자> <제목>의 요소로 전부 선택" 등)과 상세 안내 문구·위치·알림 방식(1a-03 SPEC 1.1 기준)
7. **회귀 방지 제안**: 토큰 대비를 자동 검사하는 테스트 형태 제안(예: 토큰 쌍 표 + 대비 계산 단위 테스트). 구현은 Developer

## 3. 금지·제약
- 브랜드 색(`app/src/brand/`, `brand.css`)과 주 색상 `--primary` 계열은 이번 범위 밖(필요하면 질문으로)
- 목업(1a) 색을 그대로 옮기는 것이 목적이 아니다 — 톤은 유지하되 대비 기준을 우선
- APFS 명칭·토큰 금지(ADR-002)

## 4. 산출물
- `docs/design/a11y-01/SPEC.md`: 인벤토리 표, 토큰별 현재/제안 값과 배경별 대비 표, 역상 면 규칙, D-QA04·06 문구, 회귀 테스트 제안, 수용 기준(AC ID), 영향 받는 화면 목록, 설계 질문(있으면)
- `docs/design/a11y-01/PROGRESS.md`
- Codex 검토는 Jarvis가 실행

## 5. 마지막 응답
SPEC 요약(토큰 제안 값·대비 수치·AC 수·설계 질문)과 커밋 해시
