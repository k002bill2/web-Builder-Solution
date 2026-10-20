# IMPORT-LOWS REPORT

base `2531ebf8` · 브랜치 `k002bill2/import-lows` · 근거 `dev/active/sec-readproject/REPORT.md` L-2(B-SEC-01)·L-3(B-SEC-02)·L-4(B-SEC-03)

## 결론
- B-SEC-01·02·03 세 건 모두 반영 완료(RED→GREEN·변이 확인). 스키마·엔진 계약 변경 0.
- 게이트 4종 fresh 통과(5절) · 퍼즈 REJECT/PASS 37/30 → 42/25, 마크업 주입 0(4절).
- 예산: /studio 0 · 복원 진입 +0.01KB(131.76 — 멈춤선 131.78 미만, 6절).
- Codex adversarial 1회 = approve · 지적 0 → 반영 0, 반영 후 재게이트 해당 없음(7절).

## 1. B-SEC-02 가져오기 이미지 localId = UUID v4
- 변경: `checkImages.ts` `IMPORT_IMAGE_ID`(engine `LOCAL_IMAGE_ID` 리터럴 복제) — 아니면 기존 IM-6(새 문구 0). `readProject.ts` `EXPORT_IMAGE_ID` — 내보내기는 UUID 아닌 키 레코드를 싣지 않는다(수정 전 가져온 `project-N/a`가 남아 있으면 내보낸 파일 전체가 IM-6이 되는 회귀 차단 · 기존 "실패 레코드 제외" 불변식과 같은 결).
- RED: 새 readProject 테스트 2건 FAIL(parity `undefined.source` · 결과 `['a', uid(b)]`) → GREEN 168/168(projectFile).
- 변이: ① `idOk`를 옛 `!id.includes("/")`로 → checkImages "레코드 — localId…" FAIL ② readProject 필터 제거 → "수정 전 가져온 project-1/a…" FAIL. 둘 다 복원 후 GREEN.
- parity: `IMPORT_IMAGE_ID.source`·`EXPORT_IMAGE_ID.source` = `LOCAL_IMAGE_ID.source`(테스트에서만 engine import).

## 2. B-SEC-03 저장 이미지 Blob.type
- 변경: `data/persistence/imageRecord.ts` `readImageRecord` — 변형본 하나라도 `blob.type !== image/<format>`이면 undefined → 기존 잃은 이미지 경로(`imageRestore` "불량·없는 레코드 id만 빠진다" 그대로, 새 경로 0). `readProject.ts` `exportImageOf` 같은 줄 리터럴 복제(parity 말뭉치).
- 허용 = `image/${format}` 정확히 일치(형식 3종 × 형식과 같은 MIME). 정규화(덮어쓰기) 대신 거절을 고른 이유: 저장 레코드를 고치면 쓰기 경로가 생기고, 업로드·가져오기는 이미 `out.type === choice.type`이라 정상 레코드는 걸리지 않는다.
- RED: imageRecord "Blob.type ≠ image/<형식>" FAIL · parity "말뭉치 통과 9" FAIL(14) → GREEN 335/335(persistence+projectFile) · 전체 3372/3372.
- 변이: readImageRecord 검사 제거 → 7 FAIL · exportImageOf 검사 제거 → 5 FAIL. 복원 후 GREEN.
- 픽스처: parity `blobOf`에 `{ type: image/<format> }`(이전: type 없음 — 실제 저장 레코드는 항상 type 있음). 테스트 케이스 `IMAGE/PNG`는 Blob 생성자가 소문자로 정규화해 정상과 같아져 뺐다.

## 3. B-SEC-01 문서 밖 레코드 모르는 키
- 변경: `rekey.ts` `pick` + 키 목록 4개(`Record<keyof Project | ProfileVersion | DocRecord | ProjectSnapshot, true>`) — 타입 키 전부라 타입에 필드가 늘면 컴파일이 깨진다(조용한 유실 0). 저장 스키마·엔진 계약 변경 0(저장 모양 = 기존 타입 그대로).
- RED: 새 2건 FAIL(project 키 13개 · series `__proto__` 포함) → GREEN 175/175(projectFile).
- 변이: project pick 제거 → 1 FAIL · snapshot pick 제거 → 1 FAIL. 복원 후 GREEN.
- 범위 밖(남김): 문서 본문(`doc`)·`base`·`adjustments` 안쪽 키 = ④ 규칙(checkSaveDoc·profileShape) 몫 — 이번 정규화 대상 아님. 이미 저장된(수정 전 가져온) 레코드의 모르는 키는 그대로(쓰기 경로 추가 0).

## 4. 퍼즈 67건 판정 변화 표
임시 `zzSecFuzz.test.tsx`(sec-readproject/patches 원본 그대로) 실행 → 삭제(`git status` 무변). 전 = `sec-readproject/logs/fuzz-import.txt` · 후 = `logs/fuzz-after.txt`. REJECT/PASS 37/30 → 42/25. 마크업 주입 0 유지(`renderLeaks`·`staticLeaks` 전부 `[]`).

| 케이스 | 전 | 후 | 사유 |
|---|---|---|---|
| P02 project extra hasDoc/candidateId/docSavedAt | PASS · 저장 키 11개 | PASS · 저장 키 7개 | **이번 B-SEC-01** |
| P03 project `__proto__` | PASS · 저장 키 `__proto__` 포함 | PASS · 7개 | **이번 B-SEC-01** |
| I03 localId 비UUID XSS | PASS | REJECT IM-6 | **이번 B-SEC-02** |
| I04 localId `..` | PASS | REJECT IM-6 | **이번 B-SEC-02** |
| S01 family CSS break · S07 headingWeight 1e9 · S16 scale 0 | PASS(renderMsg DROPPED) | REJECT IM-4 | base `2531ebf8`에 이미 반영된 profileShape 범위 패치(이번 diff는 profileShape·kit 0) |
| S02·S03·S04 family constructor/`__proto__`/toString | PASS · siteFaces 이상 값 | PASS · siteFaces `[]` | 같은 이유(base 반영분) |

B-SEC-03(Blob.type)은 퍼즈 범위 밖(퍼즈는 가져오기 파일 경로 — 저장 레코드는 단위 테스트 7+5건이 본다).

## 5. 게이트 (fresh, app/)
| 게이트 | 명령 | 결과 |
|---|---|---|
| typecheck | `npm run typecheck` | exit 0 |
| lint | `npm run lint` | exit 0 |
| test | `npx vitest --run` | 375 files · 3374 passed · exit 0 |
| build | `npm run build` | exit 0 (`logs/build-after.txt`) |

참고: 첫 전체 실행(B-SEC-02 미커밋 상태)에서 projectFile 밖 11파일(pages·kit·reactZip)이 실패 → 단독 재실행 144/144 통과 · 이후 전체 실행 3회 모두 통과 = 부하 플레이크(이번 diff 무관).

## 6. 예산
기준 `logs/build-base.txt`(base) ↔ `logs/build-after.txt`.
- `/studio/:projectId` 해시 정규화 진입 128.76 → 128.76KB (**0**).
- `/studio/:projectId`(저장 데이터 복원 진입) 해시 정규화 131.75 → 131.77 → 감량 1회(Blob.type 검사를 사다리 `some` 조건에 합침) → **131.76KB (+0.01KB, 멈춤선 > 131.78 미만 · 가드 통과)**. 원인 = `readImageRecord`가 복원 진입 청크 — 조건 1개는 줄일 수 없는 최소. BRIEF "감량 1회 뒤 멈춤"에 따라 추가 감량 없음.
- 그 밖 진입 합계 ±0.01KB(`/catalog`·`/compare`·`/projects`) = raw 해시 이름 흔들림(이번 diff는 그 진입 모듈 0).
## 7. Codex adversarial
- 1회: `codex-companion adversarial-review --scope branch --base 2531ebf8` (HEAD `323113ab`) → **Verdict: approve · No material findings.** 정적 검토(Codex는 테스트 재실행 안 함 — 게이트는 5절 fresh 실행이 근거).
- 반영 0건 → 코드 변경 0 · 복원 진입 131.76KB 그대로 · BRIEF-R3 3항 "반영이 있을 때만"에 따라 재게이트 생략.

## 8. 목업·규칙과 다르게 한 것 / 픽스처 개정
픽스처 `uid(tag)` 추가(`projectFileFixtures.ts` — `00000000-0000-4000-8000-<글자코드 16진 12자리>`). 단언은 정확값 유지(`expect.any` 0).

| 파일 | 이전 | 이후 |
|---|---|---|
| checkImages.test | `fileImage("a"…)`·`localId: "a"`·`img-${i}` | `fileImage(uid("a")…)`·`localId: uid("a")`·`uid(\`i${i}\`)` — 거절 줄(형식·치수·디코드·중복)도 UUID로 바꿔 원래 결함으로 거절되게(중복 = 같은 uid 2개) |
| checkImages.test | bad-id 루프·`"a/b"` | 그대로(UUID 아님이 검사 대상) |
| encode.test | `"a"`·`"b"`·`"big"`·`project-1/a` | `uid(...)`·`` `project-1/${uid("a")}` `` (`i${i}`·`h`는 encode 한도만 — 그대로) |
| rekey·writeImport.test | `fileImage("a")`·`project-N/a` | `fileImage(uid("a"))`·`` `project-N/${uid("a")}` `` |
| readProject.test | `project-1/{a,b,c,d,zz,good,bad}`·`project-10/a`·localId 단언 | 같은 키를 `uid()`로 · 새 SEC L-3 테스트만 일부러 `project-1/a` |
## 9. 커밋
`75aeb5a5` BRIEF·PROGRESS · `dd12af42` REPORT 초안 · `2dda31e2` BRIEF-R2 · `67e6d863` B-SEC-02 · `5a23a18d` B-SEC-03 · `517d81b5` B-SEC-01 · `84936340` 감량·로그 · `323113ab` BRIEF-R3·REPORT 4–6절 · (이 커밋) REPORT 확정. push 안 함.
