# M2A-CLOSE2 — 오버레이 문제 목록 · 빈 필수 칸 표시 (SPEC r4.13) — REPORT

- 브리프 `docs/06-handoff/M2A-CLOSE2_OVERLAY_BRIEF.md` · 정본 `docs/design/2a-05/SPEC.md` r4.13 · 시작 커밋 `5b6d396` · 브랜치 `k002bill2/m2a-close2` · 포트 4337

## 1. 커밋 표
| 단계 | 커밋 | 내용 |
|---|---|---|
| 골격 | `0d2670f` | PROGRESS · REPORT 골격 · gate.sh |
| O0 | `ad9a52d` | 번들 선행 실측 기록(앱 코드 변경 0) |
| O1 | `df38e0e` | 문제 목록 `ol[data-canvas-issues]` · 오버레이 문장 제거 · 테스트 이관 |
| O2 | `95fcd28` | 배지 번호 `{경고|차단} {N}` · `aria-hidden` · 안쪽 모서리 |
| O3 | (이 커밋) | 빈 필수 칸 → 차단 문제(섹션 사각형) · 같은 사각형 배지 나란히 |

## 2. 단계별 판정
| 단계 | 판정 | 근거 |
|---|---|---|
| O0 번들 선행 실측 | **통과** — 최소 시제품(O1 목록 + 배지 번호 `{경고|차단} {N}`)으로 `/studio` 진입 127.24 → **127.29**(+0.05, 멈춤선 127.70 대비 여유 0.41). Designer 상한 추정 +0.18보다 작다. B안(`sr-only`) 실측은 불필요(멈춤 조건 미발생). 시제품은 `logs/o0-proto.patch`로 보존하고 코드에서 되돌린 뒤 O1부터 RED → GREEN으로 다시 넣는다 | `logs/o0-proto-build.txt` · `logs/o0.txt`(시작 코드 gate exit 0) |
| O1 문제 목록 | **통과** — `StructureCanvas`의 캡션 다음 · `<div ref={area}>` 앞에 `<ol data-canvas-issues aria-label="문제 목록">`. 줄 = `<span>경고 N</span>` + `<p id="canvas-issue-…">문장</p>`(목록 바탕 `background-normal` · 상태 글자 토큰). 문제 0이면 목록 없음. 오버레이 issues.map은 사각형 있을 때 테두리·배지만(문장 0, sr-only 분기 삭제). RED: 새 테스트 "문제 목록(r4.13 (1))" 실패(`logs/o1-red.txt`) → GREEN | `logs/o1.txt` gate exit 0 · 표적 260 통과 |
| O2 배지 번호 · 위치 | **통과(단위)** — 배지 글자 = 목록과 같은 `issueLabel(issue, i)`("경고 N"/"차단 N", N = 목록 순번 = 문서 순서) · `aria-hidden="true"` · 위치 `-top-2.5 right-1`(위 슬롯 테두리에 걸림, Q6) → `top-1 right-1`(사각형 안쪽 오른쪽 위). 1280·390 시각 판정은 O5. RED `logs/o2-red.txt` → GREEN | `logs/o2.txt` gate exit 0 · 표적 261 |
| O3 빈 필수 칸 | **통과(단위)** — `canvasIssues.ts` `slotIssue`: 이미지 아닌 슬롯에서 필수 + 빈 값(없는 키·공백만 포함, 엔진 `isBlank` — 게이트 R-13 `slotRows.ts`와 같은 판정)이면 `block` + `onSection: true`. 캔버스는 그 문제를 **섹션 사각형**(slotKey `null`)에 표시. 같은 사각형 문제는 테두리 1개(차단 있으면 차단 색) + 배지 가로 나란히(flex, 감싸개 = 배지 부모 유지) — 같은 섹션 빈 칸 2건도 번호가 겹치지 않는다. 필드 `aria-describedby` 맨 앞 = 그 문장 id(`EditFields`가 같은 `slotIssue` 사용 — 새 테스트로 확인). 게이트 코드 변경 0(R-13 불변). RED `logs/o3-red.txt`(3건 실패) → GREEN | `logs/o3.txt` gate exit 0 · 표적(`src/components/studio` · `src/pages` · `src/features/studio`) 560 |

## 3. 번들 표
| 시점 | `/studio` 첫 화면 | `/studio` 진입 직후 (≤127.70) | 렌더 JS (≤89.70) | 렌더 CSS | 근거 |
|---|---|---|---|---|---|
| 시작 `5b6d396` | 91.78 | 127.24 | 80.12 | 6.32 | `logs/o0-base-build.txt` |
| O0 시제품(목록 + 배지 번호, 미커밋) | 91.78 | 127.29 (+0.05) | 80.12 | 6.32 | `logs/o0-proto-build.txt` · `logs/o0-proto.patch` |
| O1 | 91.78 | 127.29 | 80.12 | 6.32 | `logs/o1.txt` |
| O2 | 91.78 | 127.29 | 80.12 | 6.32 | `logs/o2.txt` |
| O3 | 91.77 | 127.38 | 80.12 | 6.32 | `logs/o3.txt` |

## 4. SPEC 차이
| # | 항목 | 구현 | 사유 |
|---|---|---|---|
| S1 | r4.13 (3) 빈 필수 칸 문장 | `{슬롯 이름표} — 필수 입력입니다`(예: "버튼 문구 — 필수 입력입니다") | 새 문구 0 — 상수는 필드·게이트의 `GATE_TEXT.requiredEmpty` 그대로, 조합은 캔버스 상한 초과 문장(`제목 — 상한 40자를 …`)과 같은 "이름표 — 문장" 꼴. 게이트 줄 문장(`Hero 버튼 문구: 필수 입력입니다`)과 구분자만 다르다(캔버스 목록은 섹션 이름 없이 이름표만 — 기존 글자 수 문장과 같은 규칙) |
| S2 | r4.13 (2) 같은 사각형의 문제 여러 개 | 테두리 1개 + 배지 나란히(오른쪽 위 안쪽부터) | SPEC은 슬롯 1개 = 배지 1개만 말한다. 빈 필수 칸은 섹션 사각형을 공유하므로 배지가 한 자리에 겹치지 않게 묶었다 |


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
