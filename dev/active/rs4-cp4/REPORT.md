# RS4-CP4 REPORT — CP0 예산 관문 **실패** · 구현 중단

작성 2026-10-16 · 브랜치 `k002bill2/rs4-cp4-spike` · base `3454702f` · 같은 머신·같은 세션 측정

## 결론
- S3안(편집기 동기 조회 + 인계 본문 lazy `import()`)은 감량 1회 뒤에도 `/studio` 판정선 초과 → **스파이크 폐기, CP1~2 착수 안 함**(BRIEF CP0-3).
- 판정선·ADR·SPEC·`check-bundle-size.mjs` 수정 0. 코드 커밋 0 (이 커밋은 `dev/active/rs4-cp4/` 문서만).
- 판정선 상향·배분은 Jarvis → 영환님 상신 사항(MQ-4-1 재상신 근거 = 아래 수치).

## CP0 수치표 (사실 · L1 — `node scripts/check-bundle-size.mjs` 출력, KB = 1000B gzip)

| 시나리오 | 판정선 | base | S3 스파이크 | S3 감량 1회 | 판정 |
|---|---|---|---|---|---|
| `/studio/:projectId` 해시 정규화 | ≤ 128.53 | **128.47** | 129.09 (+0.62) | **128.66 (+0.19)** | 초과 0.13 |
| `/studio/:projectId` raw 진입 직후 | (참고 · 130 예산) | 129.87 | 130.51 (130 초과) | 130.08 (130 초과) | — |
| `/studio` 복원 진입 해시 정규화 | ≤ 131.51 | **131.45** | 132.07 (+0.62) | **131.64 (+0.19)** | 초과 0.13 |
| `/studio` 복원 진입 raw | (참고 · 134 예산) | 132.90 | 133.55 | 133.11 | — |
| `/studio` 첫 화면 | 100 | 91.80 | 91.81 | 91.81 | 안 |
| `/profile` 첫 화면 · 진입 직후 | 100 · 125 | 99.83 · 120.62 | 99.83 · 120.64 | 99.83 · 120.64 | 안 |
| `/profile (3안 있음)` 첫 화면 · 진입 직후 | 100 · 125 | 99.83 · 123.10 | — | — | (base만 기록) |
| `/projects` 첫 화면 · 진입 직후 | 100 · 125 | 99.42 · 108.70 | 99.44 · 108.78 | 99.44 · 108.88 | 안 |

원문: `raw/base-size.txt` · `raw/s3-size.txt` · `raw/s3-reduced-size.txt` (base 빌드 `npm run build` exit 0, 스파이크 빌드 2회 모두 예산 검사로 exit 1).

## 바이트 구성 (사실 — dist 청크 gzip, Node zlib 기본 레벨)

**S3 스파이크** (`StudioLayout`이 `pendingWrites`에서 `pendingOf` 정적 import + `held`일 때 `import("studioHandoff")`):
- `pendingWrites-*.js` 청크가 `/studio` 진입에 새로 들어옴: **521B**
- `studioHandoff-*.js`(인계 본문 자리, 3줄): **100B** — 새 `import()`는 미분류라 규칙상 자동으로 집계(`check-bundle-size.mjs:25` "호출 지점을 확인하지 못하면 자동")
- `StudioLayout` 청크 증분(조회·effect·state): 나머지 수 B
- 합 ≈ +0.62KB

**감량 1회** (동기 조회 `books` WeakMap + `pendingOf`만 `pendingBooks.ts`로 분리, `pendingWrites`가 그것을 import):
- `pendingBooks-*.js` 청크: **93B** + 청크 import 오버헤드
- `studioHandoff-*.js`: **100B**(그대로 자동 집계)
- 합 ≈ +0.19KB. 부작용: `/projects` 진입 직후 +0.18KB(108.70 → 108.88, 청크 하나 더 분리)

## 해석 (추정 · L3)
- 여유가 0.06KB(128.47 → 128.53)라 **조회 모듈 청크 1개 + import 1개의 고정 오버헤드만으로 초과**한다. 인계 UI·저장 확인 버튼·cleanup `hold`(실구현)는 아직 0B인데도 넘는다.
- `studioHandoff`를 "조건 참 시나리오"로 분리 분류하면(측정 목록 변경 — MQ-4-3, 이번 레인 범위 밖) 감량안은 약 +0.09KB로 줄지만 그래도 0.06 여유를 넘을 것으로 추정(미측정).
- S2(정적 인계)는 SPEC 9절 r0 기록 +922B raw로 더 크다 — 이번 레인은 BRIEF대로 S3만 측정.

## 게이트 (스파이크 폐기 후 · fresh)
| 명령 (`app/`) | 결과 |
|---|---|
| `npm run build` | exit 0 (base, 깨끗한 트리 — 위 base 열) |
| `npm run typecheck` | exit 0 (복원 후) |
| `npm run lint` | exit 0 (복원 후) |
| `npm test -- --run` | 아래 "테스트" 참조 |

- 복원 확인(사실): `git status --short` → `?? dev/active/rs4-cp4/` 만, `git diff --stat` 빈 출력.
- 복원 후 `npm run build` 재실행은 하지 않음(미확인) — 소스가 base와 같아 base 수치와 같을 것(추정).

## 범위 밖 / 후속
- CP1·CP2(RS4-AC-05·06·11·18~23) 미착수 — 관문 실패.
- CP3(`/projects` 링크 게이트 갱신)는 원래 이번 레인 범위 밖. CP4가 없으므로 SPEC 5.3 "예산 실패 시" — 링크 게이트 유지, history 재진입은 RS4-R1로 남음(5.6).
- 서브에이전트: 사용 안 함(15분 시간 제한 · 관문 측정은 메인 직접 규칙).
