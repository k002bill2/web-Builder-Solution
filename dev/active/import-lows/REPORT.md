# IMPORT-LOWS REPORT (초안)

base `2531ebf8` · 브랜치 `k002bill2/import-lows` · 근거 `dev/active/sec-readproject/REPORT.md` L-2(B-SEC-01)·L-3(B-SEC-02)·L-4(B-SEC-03)

## 결론
- (작성 중)

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
- 변경: (작성 중)
- 범위 밖(남김): (작성 중)

## 4. 퍼즈 67건 판정 변화 표
| 케이스 | 전 | 후 | 사유 |
|---|---|---|---|

## 5. 게이트
| 게이트 | 명령 | 결과 |
|---|---|---|

## 6. 예산
## 7. Codex adversarial
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
