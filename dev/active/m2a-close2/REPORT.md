# M2A-CLOSE2 — 오버레이 문제 목록 · 빈 필수 칸 표시 (SPEC r4.13) — REPORT

- 브리프 `docs/06-handoff/M2A-CLOSE2_OVERLAY_BRIEF.md` · 정본 `docs/design/2a-05/SPEC.md` r4.13 · 시작 커밋 `5b6d396` · 브랜치 `k002bill2/m2a-close2` · 포트 4337

## 1. 커밋 표
| 단계 | 커밋 | 내용 |
|---|---|---|
| 골격 | `0d2670f` | PROGRESS · REPORT 골격 · gate.sh |
| O0 | `ad9a52d` | 번들 선행 실측 기록(앱 코드 변경 0) |
| O1 | (이 커밋) | 문제 목록 `ol[data-canvas-issues]` · 오버레이 문장 제거 · 테스트 이관 |

## 2. 단계별 판정
| 단계 | 판정 | 근거 |
|---|---|---|
| O0 번들 선행 실측 | **통과** — 최소 시제품(O1 목록 + 배지 번호 `{경고|차단} {N}`)으로 `/studio` 진입 127.24 → **127.29**(+0.05, 멈춤선 127.70 대비 여유 0.41). Designer 상한 추정 +0.18보다 작다. B안(`sr-only`) 실측은 불필요(멈춤 조건 미발생). 시제품은 `logs/o0-proto.patch`로 보존하고 코드에서 되돌린 뒤 O1부터 RED → GREEN으로 다시 넣는다 | `logs/o0-proto-build.txt` · `logs/o0.txt`(시작 코드 gate exit 0) |
| O1 문제 목록 | **통과** — `StructureCanvas`의 캡션 다음 · `<div ref={area}>` 앞에 `<ol data-canvas-issues aria-label="문제 목록">`. 줄 = `<span>경고 N</span>` + `<p id="canvas-issue-…">문장</p>`(목록 바탕 `background-normal` · 상태 글자 토큰). 문제 0이면 목록 없음. 오버레이 issues.map은 사각형 있을 때 테두리·배지만(문장 0, sr-only 분기 삭제). RED: 새 테스트 "문제 목록(r4.13 (1))" 실패(`logs/o1-red.txt`) → GREEN | `logs/o1.txt` gate exit 0 · 표적 260 통과 |

## 3. 번들 표
| 시점 | `/studio` 첫 화면 | `/studio` 진입 직후 (≤127.70) | 렌더 JS (≤89.70) | 렌더 CSS | 근거 |
|---|---|---|---|---|---|
| 시작 `5b6d396` | 91.78 | 127.24 | 80.12 | 6.32 | `logs/o0-base-build.txt` |
| O0 시제품(목록 + 배지 번호, 미커밋) | 91.78 | 127.29 (+0.05) | 80.12 | 6.32 | `logs/o0-proto-build.txt` · `logs/o0-proto.patch` |
| O1 | 91.78 | 127.29 | 80.12 | 6.32 | `logs/o1.txt` |

## 4. SPEC 차이
(작성 중)

## 5. 테스트 이관 표
단언 약화·skip 0. 같은 의도를 r4.13 구조(문장 = 목록 · 배지 = 오버레이)로 옮긴 것만.

| 파일:행(시작 커밋 기준) | 옛 단언 | 새 단언 | 근거 |
|---|---|---|---|
| `StructureCanvas.test.tsx:39` | `getByText("경고 1")` = 배지 | `[data-issue-badge]` + `toHaveTextContent("경고 1")` | r4.13 (1) 목록 줄 라벨도 "경고 1"이라 글자 검색이 2개를 찾는다 — 배지 의도 그대로 |
| `StructureCanvas.test.tsx:44` | `sentence.parentElement` 안 테두리 | `badge.parentElement` 안 테두리(같은 클래스 단언) | 문장은 목록 줄로 옮겼다 — 테두리 감싸개 = 배지 부모 |
| `StructureCanvas.test.tsx:60` | 사각형 전 `queryByText("경고 1")` null | 사각형 전 `[data-issue-badge]` null | 목록 라벨은 사각형 전에도 보인다(E-AC-49) — "배지 0" 의도 그대로(브리프 지정) |
| `StructureCanvas.test.tsx:69` | `getByText("경고 1")` 클릭 | `[data-issue-badge]` 클릭 | 39행과 같은 이유 |
| `StructureCanvas.test.tsx:155~157` | `sentence.parentElement` = 테두리 감싸개 좌표 | `badge.parentElement` 좌표(값 그대로) | 브리프 지정 |
| `StudioLayout.test.tsx:82` | `within(canvas()).getByText("경고 1")` 있음 | `[data-issue-badge]` 글자 "경고 1" | 39행과 같은 이유 |
| `StudioLayout.test.tsx:90 · 97` | `getByText("경고 1")` 클릭 | `[data-issue-badge]` 클릭 | 39행과 같은 이유 |


## 6. 브라우저 캡처
(작성 중)

## 7. Codex
(작성 중)

## 8. 남은 위험
(작성 중)

## 9. 서버
(작성 중)
