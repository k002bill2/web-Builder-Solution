# M3P-6 PROGRESS — 편집기 새 문서 업종 문구 (B-M3P-06)

base `2b67601` · P0 `2e400ff` · 2026-10-07

## 체크리스트
- [x] P0 BRIEF 커밋 (`2e400ff`)
- [x] S0 실측(아래)
- [x] TDD 예측 기록 → RED 확인(커밋 안 함)
- [x] 공용 문구 표 `src/data/industryCopy.ts` + thumbs import(G3 유지) · 썸네일 버전 `8d7310f2` 유지
- [x] 편집기 적용(레퍼런스 알면 업종 문구, 모르면 SAMPLE_COPY 폴백)
- [x] 테스트: 썸네일 h1 = 편집기 hero · 폴백 · 기존 단언 변경 0
- [x] 빌드 번들 표 · 예산 커밋(필요 시, "ADR-004 개정 8 배분 ①") — `388bca9` 기준선 128.19→128.23, 구현 `f1a2391`. 재측정 표는 REPORT
- [x] typecheck · lint · build · 전체 vitest exit0 (build·lint exit0, vitest 251/2199 pass)
- [x] Ego Lite(4337 preview, 생성 1·큐레이션 1, 캡처 ≤3) — `shots/1-ref-a-editor-hero.png`, `shots/2-gen-beauty-1-editor-hero.png`(hero "피부 결을 살피는 맞춤 관리" = 썸네일 h1). space finish·listTaskSpaces=[]·4337 리슨 0
- [x] Codex review --scope branch --base 2b67601 (≤2) — R1 지적 0 (`logs/codex-r1.log`)
- [x] REPORT(증가량 표) — `REPORT.md`

## S0 실측 (코드 변경 전, base 빌드 `npm run build`)
| 라우트 | 첫 화면 | 진입 직후 자동 |
|---|---|---|
| /catalog | 100.05/101 | 102.44 |
| /references/:id | 97.30 | 99.69 |
| /compare | 98.86 | 121.96 |
| /profile | 99.72/100 | 119.17 |
| /profile(3안) | 99.72 | 121.65 |
| /projects | 94.04 | 100.33 |
| /studio/:projectId | 91.83 | **128.19** (기준선 128.19, 판정선 128.22) |
- 문서 생성 경로: `writeStartDoc`(src/data/startDocWrite.ts)는 `_startDocWrite` 청크. importer = `memoryDocBook`(조작 뒤 — "편집 시작" 때 `memoryProjectRepository.loadDocBook` 동적 import, /profile 조작 뒤 +2.02 · /studio는 문서가 있으면 이미 받음) · `CompareDialog → comparePreviews`(/profile 조작 뒤 +20.51) · thumbs(빌드 도구).
- /studio 진입 정적 닫힘에 startDocWrite·memoryDocBook 없음(studio-off3 AUDIT 3절-3). → 문구 표를 startDocWrite 쪽에 두면 **예상 증가 위치 = 조작 뒤 청크(판정 밖)**, /studio 진입 Δ ≈ 0 예상.
- 레퍼런스 해석: 새 문서의 레퍼런스 = 프로필 버전의 `baseReferenceId`(memoryDocBook.planOf가 이미 그 레코드를 읽음). 카드(업종·레이아웃·톤) = fixtures(`references` + `generatedReferences`) 조회.
- 배치 후보 비교:
  - (a) 문구 표 + 카드 조회를 조작 뒤 청크(memoryDocBook/startDocWrite)에 — 진입 Δ≈0, 조작 뒤 +(표 ≈1~2KB gz + generatedReferences fixture) 판정 밖. **채택 후보**.
  - (b) 진입 청크(StudioLayout 등)에 표를 두고 호출부가 copy 전달 — /studio 진입 +1KB 이상 예상, 상한 128.67 위협. 탈락.

## 기존 테스트 영향 조사 (구현 전)
- SAMPLE_COPY 리터럴·`sampleCopyOf`·`SAMPLE_COPY`를 쓰는 테스트: `sampleCopy.test`·`startDocWrite.test`(writeStartDoc 직접 호출, copy 없음 → 폴백 경로 그대로)·`thumbs/thumbCopy.test`(썸네일 렌더 입력만). → 공통 문구에 묶인 단언은 모두 업종 없는 경로라 그대로 통과 예상.
- startDoc 경유 테스트(memoryProjectRepository·memoryExport·useDocSave·snapshotRevision·deferredStudio·ProfileCandidates·comparePreviews): hero 문구 단언 0(grep) — 해시는 자기 문서 기준 비교뿐.
- 썸네일 버전 = (id, SVG) 전부 sha256 앞 8자(scripts/thumbsVersion.mjs) → 표 위치 이동만으로는 안 바뀜. 예측: `8d7310f2` 유지.
- data→fixtures import 금지 가드 없음(src/test·*Guard.test grep).

## 설계 (advisor 확인)
- `src/data/industryCopy.ts`: 표 + `industryCopyOf(card) → Record | undefined`(표 밖이면 undefined, 부분 덮기 0) + `industryCopyGap`(thumbs 오류 문장용). thumbs/thumbCopy는 이것을 감싸 throw 문장 유지.
- `StartDocInput.copy?`(선택) → withSampleCopy가 `copy[k] ?? sampleCopyOf`. startDocWrite에는 표·fixture 0 → CompareDialog·thumbs 경로 바이트 그대로.
- 카드 조회(references + generatedReferences)·표 import는 `memoryDocBook`에만(조작 뒤) — `planOf`의 record.baseReferenceId.
- `comparePreviews`(3안 미리보기)는 그대로 → 미리보기 문구 ≠ 편집기 문구(REPORT에 기록).

## TDD 예측
- 새 테스트 `src/data/startDocIndustryCopy.test.ts` RED 예상: `./industryCopy` 모듈 없음 → 파일 전체 import 실패.
- 구현 뒤 GREEN 예상: 5개 it 전부 통과, 기존 테스트 변화 0.
- 번들 예측: /studio 진입 128.19 그대로(±0.01), 다른 라우트 진입 그대로. 조작 뒤 memoryProjectRepository(+memoryDocBook) +1~2.5KB(판정 밖).
