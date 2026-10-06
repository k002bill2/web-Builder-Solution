# ER-3a REPORT — 스냅샷·충돌 저장소 메모리 구현

- base `9d817bd` · 브랜치 `k002bill2/er-3a` · 서브에이전트 0 · push/merge/삭제 0 · main 5480 무접촉 · 새 의존성·lock·docs·scripts 수정 0
- 쓴 파일: `app/src/data/memoryDocBook.ts` · `app/src/data/memoryProjectRepository.ts` · `app/src/data/memoryProjectRepository.test.ts` · `app/src/data/memoryExport.test.ts` (+ `dev/active/er-3a/**`)
- `projectRepository.ts` 인터페이스 변경 0 (멈춤 조건 미발생)

## 1. AC 판정

| AC | 판정 | 근거(테스트) |
|---|---|---|
| ER-AC-S1 | 통과(저장소 부분) | `createSnapshot` 4개: 기본 이름 "수동 · 시:분"(주입 now) · kind manual · `reason` 키 없음 · revision 그대로 · 동결 / 앞뒤 공백 제거 · 30자(코드포인트) 허용 · 31자 SCHEMA_INVALID · 빈 값 = 기본 이름 · 모양 → NOT_FOUND / 12개 → 목록 전부 생성 순서 `snapshot-1..12` / commit 실패 → 0 · 빈 번호 없음 |
| ER-AC-S2 | 통과 | `restoreSnapshot` 4개: "복원 전 · 시:분" auto·restore + 새 revision(스냅샷 내용, hash 유지) · now 1회(createdAt = updatedAt) · 기존 스냅샷 `toBe` 동일·동결 · 다음 저장 STALE_DOC 0 / 모양 → NOT_FOUND(프로젝트·문서·스냅샷) → STALE_DOC(최신 동봉) / commit 실패 → 문서·스냅샷 0 / restart 자동 스냅샷 복원 |
| ER-AC-S5 | 통과 | `resolveConflict` 3개: mine = 저장된 문서를 "충돌 보존 · 시:분" auto·conflict 1개 + 내 문서 revision 최신+1 / theirs = 내 편집 보존 1개 + 저장 문서 그대로(`toBe`) / 모양(선택·L4 검증·해시·projectId) → NOT_FOUND · commit 실패(mine·theirs) → 0. `useDocSave.test.tsx` 무변경·통과(목 기반 — SPEC 6절 예상대로 안 깨짐) |
| 번호 순서(E-AC-43·44·restart) | 통과 | `memoryExport.test.ts` 2개: 수동 → 내보내기(+멱등 재생 +0) → 수동 = 1·2·3 / 내보내기 → 수동 → 복원 → 충돌 = 1..4 연속. 기존 export·restart 번호 코드 무변경(같은 `snapshot-${목록 길이+1}`) |
| ER-AC-C3 | 통과 | 6절 목록 밖 테스트 깨짐 0 · 기존 단언 수정 0 |

- "최근 10 + 이전 N개 더 보기": 인터페이스에 페이지 인자가 없어 **저장소 계약 = 전체 목록을 생성 순서로, id 연속**. 자르기·뒤집기는 ER-3b 화면 몫.
- ER-3b 계약: 복원·충돌 해결 반환은 문서뿐이므로 알림 문장 "복원 전 · 14:05"는 `listSnapshots().at(-1)`에서 읽는다(테스트로 고정).
- S9·S10(화면 저장 선행·revision 동기화)은 ER-3b 몫 — 저장소 쪽은 복원 결과 revision = 저장소 revision이라 다음 `saveDoc(restored.revision)`이 성공함을 단언(막지 않음).

## 2. 트랜잭션 실패 경로

- 세 쓰기 모두 `memoryProjectRepository`의 `call`(delay·fail 주입) 안에서 동기 실행 — 판정 → 새 객체 준비 → `commit()` → state 교체. `commit()`이 던지면 state 대입 전이라 문서·스냅샷·번호 변화 0(테스트 3건: create·restore·resolve mine/theirs).
- 청크(`memoryDocBook`) 받기 실패 = `call` 전 거부 → 쓰기 0.
- 멱등 키 없음(AC 밖 — 기록만): response 유실 뒤 재시도 시 복원은 STALE_DOC(최신 동봉), mine은 보존 스냅샷·revision이 한 번 더 생긴다, theirs는 보존 스냅샷 +1. 필요하면 saveDoc처럼 (snapshotId, expectedRevision)/(choice, revision, hash) 기록을 추가하는 후속 과제.

## 3. 테스트 수 (예측 → RED → GREEN)

| 단계 | 예측 커밋 | RED | GREEN 커밋 |
|---|---|---|---|
| S1 createSnapshot | 5 (`test(er-3a): S1 …`) | 5/5 `logs/red-s1.txt` | `c1ecde3` |
| S2 restoreSnapshot | 4 | 4/4 `logs/red-s2.txt` | S2 feat 커밋 |
| S3 resolveConflict | 4 | 4/4 `logs/red-s3.txt` | `7887bf1` |

- 전체 vitest: `npx vitest run` → exit 0 · 227 파일 · 2061 통과 (`logs/vitest-full.txt`)
- 매 GREEN 커밋 게이트: 표적 + `npx vitest run src/test` + typecheck + lint + build 모두 exit 0 (`logs/gate-s*-*.txt`, `logs/build-s*.txt`)

## 4. 번들 (gzip KB, 기준 `logs/build-base.txt` → 최종 `logs/build-s3.txt`)

| 화면 | 진입 직후 기준 → 최종 | Δ |
|---|---|---|
| /studio/:projectId | 127.05 → 127.11 (첫 91.75 → 91.77) | +0.06 (멈춤 127.39 안) |
| /projects | 100.29 → 100.33 | +0.04 |
| /profile (3안 있음) | 121.56 → 121.60 | +0.04 |
| /compare | 121.69 → 121.72 | +0.03 |
| /profile · /catalog · /references | 119.10→119.13 · 102.03→102.05 · 99.38→99.39 | +0.03 · +0.02 · +0.01 |

- 파일별 비교(raw·gzip): 실제로 커진 진입 청크는 `memoryProjectRepository` 하나(raw 2.99 → 3.05 · gzip 1.40 → 1.42). `index`·`ProfilePage`·`CompareBoardPage`·`contrast`·`profileContrast`·`memoryCompareBoardRepository`는 **raw 크기 동일·gzip +0.01** = 바뀐 청크 해시 파일명 문자열 잡음. `memoryDocBook`(조작 뒤) 2.41 → 2.90.
- **주의(판정 필요)**: /projects·/profile(3안) 측정값 +0.04는 "다른 화면 ±0.03"을 0.01 넘는다. 실코드 몫은 +0.02이고 나머지는 해시 잡음(빌드마다 0~0.02 흔들림 — S2 빌드 때 /projects +0.03). 줄인 시도: `nameLength` 공유 import 제거(0.07 → 0.04) · 메서드 3개를 위임 1개(`write`)로 · `missing` 삭제.
- 렌더 문서 JS 84.19 → 84.19(0). 렌더 변화 0(화면 코드 무변경).

## 5. Ego Lite

- 미사용 · 열린 창 0 (화면 변경 0 — 저장소·단위 테스트만).

## 6. Codex

- r1 `node codex-companion.mjs review --scope branch --base 9d817bd` 실제 완료(`logs/codex-r1.txt`): "새로 도입된 수정 필요 결함은 발견하지 못했습니다" — 지적 0건. Codex 쪽 샌드박스 EPERM으로 Codex가 테스트를 직접 돌리지는 못함(런타임 검증은 위 3절 로컬 실행이 증거). 1라운드로 종료(≤2).

## 7. meta

- 턴: 약 33턴(40 상한 안). 2a-05·SPEC와 다르게 한 곳: 없음. 충돌 보존 이름 "충돌 보존 · 시:분"은 5.11 "자동은 종류 + 시각" 규칙을 따름.
