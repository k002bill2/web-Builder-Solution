# P2-L1 REPORT — 프로젝트 파일 형식·검증·재매김·이미지 재인코딩 (순수 모듈)

- 브랜치 `k002bill2/p2-l1` · base `2285df8` · 커밋: f781931(P0) → a5692c4(format·rekeyDoc) → 5574ba2(L1a ①~④) → a8b3fa9(L1b ⑤·rekey·encode) → b409152(테스트 타입 오류 수정) → ff59ee4(REPORT) → (parity·⑤ 순서 커밋)
- 정본: P2-SPEC 머리 "Jarvis 채택 결정" 우선(⑤ 재인코딩 유지 · AC-P01 수정본) · 8절 L1 행.

## 1. 바뀐 파일
| 파일 | 내용 |
|---|---|
| `app/src/features/projectFile/format.ts` (새) | 상수(`design-studio-project`·formatVersion 1·SCHEMA 1·96MB·24개·60MB) · IM-1~IM-6·EX-12 문장 · `failure` · 타입 `ProjectFile`·`FileImage` |
| `app/src/features/projectFile/checkFile.ts` (새) | ① 크기(읽기 전) → ② 파싱 → ③ 봉투(미래 버전 IM-3을 다른 필드보다 먼저) → ④ 레코드(원래 id로 `checkSaveDoc` · 계열 1..n · 이름 `validateProjectName` 정확히 같음 · 스냅샷 머리 · `doc.profileVersion ≤ 계열 길이`) → ⑤ `checkImages` · `recordsHold`(재매김 뒤 ④ 재검사용) |
| `app/src/features/projectFile/checkImages.ts` (새) | 한도(디코드 전 IM-5) → 레코드 규칙(readImageRecord와 같음 + 엄격 base64 정규식, IM-6) → 변형본마다 `createImageBitmap` 디코드 · 치수 = 사다리 폭·`variantHeight` → **업로드 경로 인코더**(`IngestDeps.encode`, 설정 = `chooseFormat` — webp 0.82·jpeg 0.85·png) 재인코딩 · 출력 type·머리 서명 = format · bitmap 전부 close · `bytes` = 새 합 · 재인코딩 뒤 60MB 재검사 |
| `app/src/features/projectFile/rekey.ts` (새) | `rekeyImport(file, target, now)` — 새 id `nextSeqId`(현존·묘비) · project `updatedAt`만 now · series profileId · `rekeyDoc`(문서·스냅샷) · 스냅샷 hash = 새 doc hash · snapshotId·snapshotSeq 그대로 · 이미지 키 `${새 id}/${localId}` · 머리 · 재검사 실패 IM-4. `mergeImport(state, plan)` — 기존 레코드 같은 참조 · seq·gen 그대로 |
| `app/src/features/projectFile/encode.ts` (새) | `encodeProjectFile` — 조각 배열 → `Blob(application/json)` · 변형본 1개씩 base64 · 자기 거절 EX-12(24개·60MB 사전, 96MB 사후) · `exportLimitHolds` |
| `app/src/data/startDocWrite.ts` | `rekeyDoc(doc, projectId)` 1개 추가(projectId 치환 + `hashDoc`) |
| `app/src/test/projectFileFixtures.ts` (새) | 시드(실제 엔진 문서·스냅샷 3개·snapshotSeq 2 · 계열 2버전) · 가짜 이미지 바이트·가짜 `IngestDeps` |
| 테스트(새·추가) | `format.test`(3) · `checkFile.test`(15) · `checkImages.test`(12) · `rekey.test`(5) · `encode.test`(3) · `startDocWrite.test` +1 |

## 2. 검증 (fresh 실행, app/)
| 명령 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npx vitest --run` (전체, 마지막 실행) | exit 0 · 289 파일 · 2520 테스트 통과 |
| `npm run build` | exit 0 · 아래 번들 표 |

번들(KB, 진입 직후 자동 로드 포함) — a5692c4 직후 · b409152 뒤 · 마지막 커밋 전 세 번 실측, 모두 같음:
| 시나리오 | main 기준 | 이 레인 | 증가 |
|---|---|---|---|
| `/studio` | 129.09 | 129.09 | 0 |
| `/studio` 복원 | 132.13 | 132.13 | 0 |
| `/profile` 첫 화면 | 99.87 | 99.87 | 0 |
| `/projects` | 104.69 | 104.69 | 0 |
| `/compare` | 122.71 | 122.71 | 0 |
- `startDocWrite.ts`는 조작 뒤 청크라 `rekeyDoc` 추가가 진입 수치를 바꾸지 않았다(실측).
- 새 모듈은 아직 어떤 화면도 import하지 않는다 → 6절 "진입 closure 검증 함수 import(`validateProjectName`·`formatFromMagic`·`widthLadder`·`exceedsPixelLimit`)가 공유 청크를 재분할하는가"는 **L2/L3 배선 때 실측**해야 한다(이 레인 수치로는 판정 불가).

## 3. TDD 기록
- R1 format·rekeyDoc: 예측(모듈 없음 · `rekeyDoc is not a function`) = 실제. R2 checkFile · R3 checkImages · R4 rekey·encode: 예측(모듈 없음) = 실제. RED 테스트 tip 커밋 0 · skip 0 · amend·rebase 0.
- 단언 약화 0. b409152는 테스트 헬퍼 타입만 고침(비교 대상·기대값 같음).
- 실수 1건: a8b3fa9 커밋 명령에서 heredoc 뒤 줄이 `&&` 체인 밖이라 tsc 실패(테스트 파일 타입 오류 2건)를 못 보고 커밋 → b409152로 수정(amend 금지 준수). 런타임 테스트는 그때도 통과.

## 4. AC 대응 (U)
- **AC-P02 거절 = 쓰기 0**: 96MB+1(text 호출 0) · 0바이트 · JSON 아님 · format 다름 · formatVersion 2 · schemaVersion 2 · checkSaveDoc 실패 · 계열 구멍 · 이미지 25개 · 선언 합 60MB+1(디코드 0) · base64 잘못된 문자·패딩 누락·공백 · 서명 ≠ format · 사다리 불일치 · bytes 합 불일치 · 디코드 실패(인코딩 0) → 각 IM 정확한 문장, 결과 객체 없음. 짝: 내보내기 25개·60MB+1·96MB+1 = EX-12. **"IDB 트랜잭션 0" 단언은 L3 몫**(이 레인엔 쓰기 코드 없음 — 실패 시 계획 객체가 없어 쓸 것이 없다).
- **AC-P01 왕복(수정본)**: encode → checkFile → rekey — 문서·스냅샷 projectId·hash 외 canonical 동일 · snapshotSeq 동일 · series profileId 외 동일 · 이미지 키·형식·치수·사다리 동일 + 디코드 성공 · 바이트 = 재인코딩 출력.
- **AC-P03**: project-1 대상 → project-2 · 기존 레코드 같은 참조 · 2회 = project-3 · 묘비 seq 5 → project-6 · seq 불변.
- **AC-P05**: 병합 상태 + 새 문서 레코드로 실제 `openLocalSync`(checkState·readDoc) 성공 · 문서 시드에 새 id. localSync 수정 0.
- **parity**: 재인코딩 결과(png 3단·webp·jpeg)를 실제 `readImageRecord`(다음 열기 `imageRestore`가 쓰는 함수)가 같은 값으로 받는다 — 가져온 이미지가 잃은 이미지가 되지 않음.
- 미래 버전 IM-3: formatVersion 2 + series 없음도 IM-3(다른 필드보다 먼저).

## 5. 판단·목업/SPEC과 다른 점
- ⑥ 참조 판정 **생략**(SPEC 6절 택1): `recordRefs`가 `imageStore.retainedIds`(복원 closure)에 묶임 · 참조 밖 이미지는 다음 flush `imageOps`가 지운다(P1D F2).
- 재인코딩 디코드 옵션 = `{}`(브라우저 기본). 저장 변형본은 이미 캔버스 출력이라 EXIF 없음 — 실제 동작은 L3 Ego Lite에서 확인.
- 치수 검사는 폭(사다리)에 더해 높이(`variantHeight`)도 본다 — 업로드 경로가 같은 식으로 만들고 크기 불일치를 던지므로 정상 파일은 통과.
- ⑤ 판정 순서 = SPEC대로 개수 → (bytes 정수 아니면 IM-6) → 합 60MB(IM-5) → localId·중복·레코드 규칙(IM-6). 처음 구현은 localId 검사가 합계보다 먼저였고 advisor 점검에서 고침(테스트 "localId 중복 + 합 60MB+1 = IM-5" 추가 — 이 1건은 수정과 같은 단계에서 써서 RED를 실행으로 확인하지 못함, 옛 순서면 IM-6이 나와 실패했을 것으로 판단).
- localId 빈 문자열도 IM-6(SPEC은 "문자열·/ 없음"만 명시 — 빈 id는 슬롯 참조가 될 수 없어 더함).

## 6. 한계·남은 일
- 재인코딩 손실이 왕복마다 누적될 수 있음(Jarvis 결정 2 — SPEC 10절 추가는 docs 몫, 이 레인 docs 수정 0).
- 대상 브라우저에 webp 인코더가 없으면 webp 이미지 가져오기 = IM-6(형식 불일치로 닫음). 다른 형식으로 바꿔 저장하지 않는다.
- 3.2 메모리 규칙 ②와 차이: 파싱 객체가 base64 문자열을 ⑤가 끝날 때까지 참조하고, 이미지 1건의 변형본을 한꺼번에 base64 디코드한다(디코드·재인코딩은 1개씩). 큰 파일 피크 메모리는 실측 안 함(SPEC 8절).
- `upgradeDatabase`·`DB_VERSION` import 실측은 쓰기 트랜잭션(L3)에서 — 이 레인은 IDB 코드 0.
- 실제 디코드·인코딩·메모리는 jsdom 밖 — L3 Ego Lite. **Ego Lite 생략 사유: UI·화면 0(순수 모듈).** Codex 검증은 Jarvis 몫(미실행).
- 지켜진 금지: 엔진·PageDoc 계약·docs/**·lock·CLAUDE.md 수정 0 · 새 의존성 0 · 서브에이전트 0 · push/merge/삭제 0 · main 5480 무접촉.

## 7. Codex r1 수정 (codex-r1-jarvis.txt 3건)
| # | 지적 | 수정 | 회귀 테스트 |
|---|---|---|---|
| ①P1 | BASE64 반복 그룹 정규식이 8MiB에서 RangeError → `checkFile` reject (node 실측: 4MiB 통과·8MiB RangeError) | `checkImages.ts` 정규식 삭제 → `isStrictBase64`(길이 %4 · 끝 `=`/`==` 패딩 · 나머지 문자 1회 선형 스캔, 규칙은 옛 정규식과 같음 · node 80MiB 253ms) · `checkOne` 본문 전체(`ruledVariants` 포함) try → 예외 = IM-6 | `checkImages.test` "A"×8MiB = IM-6 결과(checkImages·checkFile 둘 다 reject 0) · 변형본 getter 던짐 = IM-6 · `encode.test` 원본 6MiB(base64 8MiB) encode → checkFile ok · 디코드 1 · 재인코딩 바이트 |
| ②P2 | series가 `{profileId,version}`만이어도 통과 → ProfilePanel 예외 | 새 `profileShape.ts` `profileVersionShapeOk` → `seriesOk`에서 호출 · 손상 = IM-4 | Codex 재현(`{profileId,version}` + doc:null) = IM-4 · 필드 손상 19종 각각 IM-4 · 실제 `confirmProfile` 버전 = 통과(과잉 엄격 0) |
| ③P2 | 스냅샷 문서 profileVersion을 계열과 대조 안 함 → 복원 뒤 내보내기 NOT_FOUND | `docHolds`(checkSaveDoc + profileVersion 정수 1..n)를 현재 문서·모든 스냅샷 문서에 같이 적용 | 현재 v2 · 스냅샷 v3(`writeStartDoc`으로 새로 만든 문서 · hash 일치) · 계열 v1·v2 = IM-4 |

- **② 필수 필드 근거**: 기존 ProfileVersion 검증 함수 없음(grep `ProfileVersionSchema|designProfileSchema` 0건 · zod 사용 파일은 `jobRecord.ts`뿐). 사용처 grep으로 가드 없이 읽는 필드만 요구: `origin`·`baseReferenceId`·`createdAt` · `base.color_tokens[역할 5개].$value`(ProfilePanel:35·profileFields:79) · `typography_tokens.family·headingWeight·bodyWeight·scale`(profileFields:61·CompareDialog:131) · `spacing_tokens.grid·sectionGap`(profileFields:74·profileDiff:57) · `motion_preset`(docPurpose:20) · `component_choices` 객체(ProfilePanel:57) · `section_plan[].type·variant`(profileFields:76·ProfileValues:83) · `source_reference_ids` 문자열 배열(useProfileDetail:62) · `visual_direction`·`layout_direction`(profileFields:64-65) · `library_version`·`seed`(memoryGenerate:62-64·memoryDocBook:128) · `selection_mode`(ProfilePage:197) · `adjustments` 객체 + 있으면 `density·contrast·motion·purpose` 문자열 · `corrections[]` {role(역할 5개)·from·to·check 문자열}(ProfilePanel:35·comparePreviews:52). 선택 필드(basedOn·boardRevision·dropped·component_choices 하위·$extensions)는 요구 안 함. zod 미사용(가져오기 청크에 zod를 끌어오지 않게).
- **fixture 교정(단언 약화 아님)**: `seedSeries`의 `base: {}`를 실제 `DesignProfileInput` 리터럴(`SEED_BASE`, 타입 검사 통과)로 · `seedDoc`에 profileVersion 인자 · `toBase64` 조각 단위(큰 바이트 spread 한도) · 가짜 디코더가 `^(re:)?WxH` 매치로 치수를 읽음(뒤 패딩 허용). 기존 테스트 기대값 변경 0.
- **TDD**: RED 예측(PROGRESS) = 실제 6건 FAIL(① RangeError 2 · getter `boom` reject 1 · ②③ `ok:true` 3) · 실제 confirmProfile 통과 케이스는 예측대로 RED 때도 PASS · 기존 41건 PASS. RED 커밋 0 · amend·rebase 0. lint 1건(fixture sparse array) 고친 뒤 재실행.
- **검증(fresh, app/)**: 아래 8절.
- 남김: checkImages 앞단(개수·bytes·localId) 속성 접근은 try 밖 — JSON 파싱 결과에는 getter가 없어 던질 수 없음(이번 diff 범위 밖).

## 8. Codex r1 수정 검증 (fresh, app/)
| 명령 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0 · `/studio` 129.09 · 복원 132.13 · `/profile` 99.87 · `/projects` 104.69 · `/compare` 122.71 — 변화 0 |
| `npx vitest --run` (전체) | 1회차 exit 1 — `SectionAdd.test.tsx` 포커스 1건(이번 diff 무관 파일 · build 직후 실행) · 단독 재실행 6/6 통과 · 전체 재실행 **exit 0 · 289 파일 · 2527 테스트** |
- 금지 준수: 엔진·계약·docs·lock 수정 0 · 새 의존성 0 · 서브에이전트 0 · Ego Lite·Codex 미실행 · push/merge/삭제 0 · amend/rebase 0.
