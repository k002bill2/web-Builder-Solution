# TEST-GAPS-TS REPORT

## 결론
- B-M2B-05c(TS-AC-16)·B-CI-01 테스트 공백 2건 닫힘. 앱 소스(비테스트) 변경 0 · 새 의존성 0 · skip 0.
- ADR-008 6절 제출 기록 1줄 추가 + "아직 미발송" 취소선 정정. BACKLOG 두 행 닫힘 표기.

## 커밋
| 항목 | SHA |
|---|---|
| PROGRESS | 0345d3a9 |
| B-CI-01 (테스트 + ci.yml + README + logs/tz-*) | 311a1b0c |
| ADR-008 6절 | a615ec06 |
| B-M2B-05c (테스트 + logs/m4-*) | 6ad20f59 |
| BACKLOG | c6bbc139 |

## 1. B-M2B-05c — M4 RED/GREEN
- 하네스: 기존 `SnapshotFlow.test.tsx`의 `snapshotRepo`·`openStudio`·`SERIES`·`previewFirst` 재사용. 팔레트 테스트(P2) 옆에 추가.
- 시나리오: 편집 문서 v2·`typeScale 1.2`, 스냅샷 v2·`typeScale 1.5` → 캔버스 `kitTokens.type.scale` 1.2 → 미리보기 진입 1.5 → "편집으로 돌아가기" 1.2.
- RED (`logs/m4-red.txt`): 두 의존성 제거 diff 포함, 전체 스위트 `1 failed | 3459 passed (3460)` — 실패는 새 테스트 1건뿐.
- GREEN (`logs/m4-green.txt`): `git checkout -- app/src/components/studio/StudioLayout.tsx` 후 diff 빈 값, `384 files · 3460 passed`.
- 한계: 312줄 `kitTokens`(편집 문서 쪽)는 캔버스가 아니라 PNG 캡처 경로에만 쓰인다. 이번 테스트는 315줄 `canvasTokens` 의존성을 직접 지키며, M4(두 의존성 동시 제거)는 잡는다. 312줄 단독 제거 변이는 캡처 경로 테스트가 필요 — 범위 밖.

## 2. B-CI-01 — TZ 3종
- 테스트 안 `localHhmm(iso)`(=`getHours`/`getMinutes` 로컬 시계)로 기대값 계산. vitest `TZ` 고정 미사용.
- `TZ=UTC` / `TZ=Asia/Seoul` / `TZ=America/New_York` 각각 `25 passed (25)` — `logs/tz-UTC.txt`·`tz-Asia-Seoul.txt`·`tz-America-New_York.txt`.
- `.github/workflows/ci.yml` test job의 `env:`·주석·`TZ: Asia/Seoul` 3줄만 삭제(액션 SHA·job 이름 불변). README CI 절 2줄 정정.

### 바꾼 expect (before → after, 약화 없음 — KST에서는 같은 문자열)
| 줄 | before | after |
|---|---|---|
| 178 | `name: "수동 · 18:00"` | ``name: `수동 · ${localHhmm("2026-09-27T09:00:01.000Z")}` `` |
| 234 | `name: "복원 전 · 18:00"` | ``name: `복원 전 · ${localHhmm(restored.updatedAt)}` `` |
| 297 | `name: "충돌 보존 · 18:00"` | ``name: `충돌 보존 · ${localHhmm(saved.updatedAt)}` `` |

## 3. 게이트·예산
- `logs/gates.txt`: fresh `npm run typecheck && npm run lint && npx vitest run --maxWorkers=4 && npm run build` → `EXIT=0` · `384 files · 3460 passed`.
- 예산: `/studio/:projectId` 해시 정규화 진입 **128.79KB**(기준선 128.79) · 저장 데이터 복원 진입 **131.79KB**(기준선 131.79) — 증분 0.
- `git diff --stat 3aff1210 HEAD -- app/src` = 테스트 파일 2개뿐(비테스트 앱 소스 0).
