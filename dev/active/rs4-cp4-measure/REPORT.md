상향 필요: 정규화 +1.20 KB · raw 한도 +1.15 KB (배치안 a 기준 · 기본 `/studio` — 복원 진입은 정규화 +1.20 · raw +0.18) · 감량(M2) 미측정 상태의 수치

# RS4-CP4-MEASURE REPORT

작성 2026-10-17 · 브랜치 `k002bill2/rs4-cp4-measure` · base `f477c161` · 같은 머신·직렬 빌드 · KB = 1000B gzip(Node zlib 기본)

## 요약
1. 편집기 인계 전체(M1)를 실제 코드로 붙이면 기본 `/studio` 정규화 **129.73**(판정선 128.53 대비 +1.20), raw **131.15**(한도 130 대비 +1.15). 배치안 a(정적 조회) 기준.
2. 배치안 b(조회 lazy · 진입 0B 지향)는 `/studio` 129.50(+0.97)으로 작지만, rolldown 런타임 청크(428B)가 **공통 JS**로 분리돼 `/profile` 첫 화면 100.13 > 100 · `/catalog` 100.61(+0.31)이 된다 → 다른 라우트를 깨므로 권장하지 않음.
3. 권장 배치안 = **a**. M2(동작 변화 0 감량)는 시간 한도(60분)로 **실측 0건** — BLOCKED. 결론의 상향 폭은 감량 전 값이다.

## M0 — base f477c161 (코드 변경 0, `npm run build` exit 0 — `raw/base-build.txt`, `raw/base-size.txt`)

| 시나리오 | 판정선/한도 | base |
|---|---|---|
| `/studio/:projectId` 정규화 | ≤ 128.53 | **128.47** (기준선 128.50 + 0.03) |
| `/studio/:projectId` raw 진입 직후 | ≤ 130 | 129.86 |
| 복원 진입 정규화 | ≤ 131.51 | **131.45** |
| 복원 진입 raw | ≤ 134 | 132.90 |
| `/studio` 첫 화면 | ≤ 100 | 91.79 |
| `/profile` 첫 화면 · 진입 | 100 · 125 | 99.83 · 120.62 |
| `/profile (3안 있음)` 첫 화면 · 진입 | 100 · 125 | 99.83 · 123.10 |
| `/projects` 첫 화면 · 진입 | 100 · 125 | 99.43 · 108.72 |

청크별(`tools/chunks.mjs`, `raw/base-studio-chunks.txt`): 21청크, 공통 외 상위 StudioLayout 19.40KB · _issue 8.03 · deferredStudio 2.74 · StudioPage 1.82 · memoryProjectRepository 1.79.


## M1 — 편집기 인계 전체 스파이크 (측정용 · 커밋 0 · 패치 `patches/`)

붙인 것(실제 동작 코드, typecheck·lint 통과 후 빌드):
- `pendingWrites`: `PendingDraft` 타입 · `hold`(이전 draft의 `under` 계승) · `release`(토큰 일치 때만 해제, 불일치면 draft의 `under`만 제거 — N1)
- `useAutosaveScheduler`: `initial` 옵션(시작 상태 · stale이면 자동 저장 0) · `busy()`(저장 전 변경·진행 중 저장)
- `useDocSave`: `initial` 옵션(unconfirmed = failed 계열 · dirty = draft 복원 첫 change · stale = 충돌 latest) · `confirm()`(busy면 `retry()`+`flushed`, 아니면 `confirmDoc` 1회 · resolve 때 편집 0·busy 0일 때만 `settle`)
- `studioRepository`: `confirmDoc` 연결
- `StudioLayout`: 진입 1회 `pendingOf` · draft 내용·이미지 맵 복원 · 언마운트 cleanup `hold(PendingDraft)` — 저장 훅보다 먼저 선언(hold → 리스너 해제 순서) · 미확인일 때 인계 본문 lazy
- `studioHandoff.tsx`(lazy 본문): 상태 글자 "브라우저 저장을 확인하지 못했습니다" · "저장 확인"(aria-busy/disabled · 연타 1회) · 성공 `role=status`(+ "새로 시작(편집 시작)은 반영되지 않았습니다") · 4.3 사유 문형(READ_ONLY 유지 / STALE·CLEARED·IMAGES_MISSING 버튼 숨김 / NOT_FOUND 해제) · 토큰 해제
- `/projects` 행: `PendingDraft` 3문형 + "편집기에서 이어 저장" 라벨(`pendingRows`·`pendingText`)

### 배치안 비교 (사실 · L1 — `raw/m1*-build.txt` check-bundle-size 출력 + `tools/chunks.mjs`)

| 시나리오 | 판정선/한도 | base | (a) S3 정적 조회 + 본문 lazy | (b′) 조회 lazy(전역 심볼) + 본문 lazy |
|---|---|---|---|---|
| 기본 `/studio` 정규화 | ≤ 128.53 | 128.47 | **129.73 (+1.20 초과)** | 129.50 (+0.97 초과) |
| 기본 `/studio` raw | ≤ 130 | 129.86 | **131.15 (+1.15 초과)** | 131.01 (+1.01 초과) |
| 복원 진입 정규화 | ≤ 131.51 | 131.45 | 132.71 (+1.20) | 132.48 (+0.97) |
| 복원 진입 raw | ≤ 134 | 132.90 | 134.18 (+0.18) | 134.04 (+0.04) |
| `pending 있음`(본문 lazy 조건 참 · 측정 목록 밖, `tools/chunks.mjs`) 정규화 · raw | 한도 없음(MQ-4-3) | — | 130.92 · 132.38 | 131.48 · 133.05 |
| 복원 + pending 정규화 · raw | 〃 | — | 133.90 · 135.41 | 134.47 · 136.08 |
| `/studio` 첫 화면 | ≤ 100 | 91.79 | 91.82 | 92.12 |
| `/profile` 첫 화면 · 진입 | 100 · 125 | 99.83 · 120.62 | 99.82 · 120.63 | **100.13 초과** · 121.00 |
| `/projects` 첫 화면 · 진입 | 100 · 125 | 99.43 · 108.72 | 99.45 · 109.10 | 99.78 · 109.63 |
| `/catalog` 첫 화면 | ≤ 101 | 100.30 | (변화 없음) | 100.61 |

- (b) 1차(모듈 최상위에서 전역 등록, `patches/m1b-global-sideeffect.patch`): `/studio` 129.48 · `/profile` 첫 화면 100.11 — 같은 런타임 분리. 부작용을 `settle()` 안으로 옮긴 (b′)에서도 `rolldown-runtime` 428B가 공통에 남음 → 원인은 공유 청크(`pendingWrites`)의 dynamic import로 추정(L3 — 확인 빌드 없음).
- 바이트 구성 (a)(raw): `pendingWrites` 청크 638B(진입 정적) · `StudioLayout` +622B(19,400 → 20,022 — 조회·cleanup·훅 옵션·인계 자리) · 훅 증분은 StudioLayout 청크 안 · `studioHandoff` 1,230B(lazy — 기본 시나리오에 미집계).
- 기존 스크립트 규칙: 등록 안 된 `import()`는 기계적으로 집계되지 않는다(`bundleBudget.mjs:80` — auto 목록 정적 닫힘만). `pending 있음`·조회 lazy 시나리오는 스크립트 수정 금지라 `tools/chunks.mjs`로 같은 닫힘 규칙을 써서 계산했다.

### UNMEASURED (못 붙인 부분 — 0B로 제시하지 않음)
1. N3 `settling` 대기: 진입 시 `useStudioDoc`에서 draft의 진행 중 저장을 기다리는 코드 — 진행 중 저장 promise를 훅이 노출하지 않아 미구현(예상 +수십 B, L3).
2. 편집 저장 시작 때 기억 토큰 캡처 → resolve 시 해제(5.3 "편집 저장") — 미구현(`save()`에 ticket·release 호출 · pendingWrites가 정적이면 +수십 B, L3).
3. `blocked` 판정(STALE_TAB 실패 상태를 draft에 표시) — 미구현.
4. draft의 `baseRevision`(revisionRef) 보존 — draft doc의 revision 필드에 의존(정확한 값 보장 없음).
5. `/projects` `PendingRecord` 행 "편집기 열기" 링크 게이트 해제·`PendingDraft` 링크 렌더(ProjectRow) — 문구만 추가, 링크 렌더 미변경.
6. 기존 테스트 정합성(범위 밖) · 브라우저 동작 확인(금지).

## M2 — 동작 변화 0 감량 후보
- **BLOCKED: 시간 한도(60분) — M1 배치안 3빌드 뒤 실측 0건.** 청크 목록은 `raw/base-studio-chunks.txt`(공통 외 상위: StudioLayout 19.40 · _issue 8.03 · deferredStudio 2.74 · StudioPage 1.82 · memoryProjectRepository 1.79). 후보 조사 결과는 아래 "서브에이전트" 절(추정, 빌드 미검증).
- M2+M1 합산 빌드: BLOCKED(같은 사유).

## 사실 / 추정 / 미확인
- 사실(L1): 위 표 수치 전부(빌드 출력·dist gzip). 복원 뒤 base 재빌드 = 128.47 · 131.45 · `/projects` 108.72 · `/profile` 99.83(M0와 같음, `raw/final-build.txt`).
- 추정(L3): UNMEASURED 1·2를 더하면 (a)는 +0.05~0.1KB 더 늘 가능성. (b)의 런타임 청크 원인.
- 미확인: M2 감량으로 +1.20을 상쇄할 수 있는지 — 직전 감량 기록(studio-off3·entry-slim·er-off·er-off2)이 이미 큰 후보를 썼고 여유가 0.06KB인 상태라 1.2KB 상쇄는 어려울 것으로 보나 실측 없음.

## 마지막 fresh 게이트 (복원 뒤, `app/`)
GATE_PLACEHOLDER

## 서브에이전트
- ① M1 SPEC-4 5.3·5.4 요구 코드 경로 조사(읽기 전용 Explore) — 완료, 결과를 스파이크 설계에 반영(PendingDraft·hold 부재, 등록 안 된 import()는 기계 집계 안 됨 확인).
- ② M2 `/studio` closure 후보 조사(읽기 전용 Explore) — M2_PLACEHOLDER
