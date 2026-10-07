# PERSIST-ADR 1단계 — 현재 사실표 (L1 = 코드·문서 grep, 2026-10-07 base b0b26cf)

표기: [L1] 파일:줄로 확인 · [추정] 측정 안 함.

## 1. 저장소 인터페이스 vs 구현

| 대상 | 인터페이스(경계) | 구현 | 수명 | 교체 가능성 |
|---|---|---|---|---|
| 프로젝트 | `ProjectRepository<TDoc>` `app/src/data/projectRepository.ts:141-164` (모든 메서드 `Promise`, REST 주석 GET/PUT/POST) | `createMemoryProjectRepository` `memoryProjectRepository.ts` — `persistence: "memory"` | 탭 | 높음 — 인터페이스 파일은 타입·오류만, 구현은 동적 import(`deferredStudio.ts` `STUDIO_IMPORTS.projects`) |
| 편집 문서·스냅샷·멱등 기록·내보내기 잡 | (위 인터페이스의 일부) | `createDocBook` `memoryDocBook.ts:435` 클로저 `state: DocState`(docs·snapshots·starts·saves·exports·jobs Map) | 탭 | 중간 — 판정 로직과 상태가 한 클로저에 섞임. 영속 시 상태 읽기/쓰기 지점 분리 필요 |
| 프로필 계열·보드 확정/조정 멱등·생성 잡·프로젝트 목록 | `StudioStore`/`StudioTx` `studioStore.ts:686-717` (동기 `transact`) | `createStudioStore()` `studioStore.ts:743` 클로저 `state: StudioState` | 탭 | 중간 — **동기 인터페이스**라 IndexedDB(비동기)를 그대로 끼울 수 없음 → 메모리 캐시 + 비동기 write-through 필요 |
| 프로필 | `ProfileRepository` `profileRepository.ts` | `memoryProfileRepository.ts` (store 공유) | 탭 | 높음 |
| 비교 보드 | `CompareBoardRepository` `compareBoardRepository.ts` | `memoryCompareBoardRepository.ts` (store 공유, 보드 자체 상태는 구현 내부) | 탭 | 높음 |
| 3안 생성 | `GenerationRepository` `generationRepository.ts` | `memoryGenerationRepository.ts` (store 공유) | 탭 | 높음 |
| 레퍼런스 카탈로그 | `ReferenceRepository` | 픽스처(정적, 읽기 전용) | 빌드 | 영속 대상 아님 |
| 저장한 레퍼런스(보관함 FR-CMP-01) | 없음 — React context | `features/saved/SavedReferencesContext.tsx:12` `useState<Set>` | 탭(컴포넌트 트리) | 낮음 — 저장소 경계 없음 |
| 이미지 | 타입만 `features/studio/images/store/types.ts` (`ImageHost` = React state 튜플) | `imageStore.ts` 순수 함수 + 모듈 `WeakMap<Blob, ImageMeta>`; 맵 자체는 `StudioLayout` 편집 틀 state | **편집 틀**(편집기 떠나면 소실 — 문서보다 짧음) | 낮음 — 저장소 인터페이스 없음 |

- 조립: 앱 = `createDeferredStudio` (`deferredStudio.ts`) 가 `createStudioStore()` 1개를 만들어 4저장소에 공유. 테스트 = `createMemoryStudio`(`memoryStudio.ts`). 둘 다 모듈 싱글턴 아님(렌더마다 새 store, id `profile-1`부터).
- `ProjectPersistence = "memory" | "server"` (`projectRepository.ts:8`) — **"local" 값 없음**. 화면 분기: `SaveStatus` 문구 "이 탭에 저장됨" vs "저장됨"(`saveStatusText` 34행), 떠나기 경고 `needsUnloadGuard` memory면 항상 true(`useAutosaveScheduler.ts:66-67`).

## 2. 데이터 크기·상한

| 항목 | 값 | 근거 |
|---|---|---|
| 업로드 파일 1개 | 10MB 상한 | [L1] `ingest/fileType.ts:8` `MAX_FILE_BYTES` |
| 이미지 변형본 | 640·1280·1920 Blob(webp/jpeg/png) + width·height·format·bytes 메타 | [L1] m2c SPEC 98행, `imageStore.ts:10` |
| 문서 이미지 | 켜진 슬롯 12개 · 30MB | [L1] `imageStore.ts:16-17` |
| 탭 이미지(문서+되돌리기+스냅샷 참조) | 24개 · 60MB | [L1] `imageStore.ts:18-19` |
| 정적 HTML 메시지 상한 | 8,000,000자 (`HTML_MAX`) < 이미지 30MB — B-M2C-01 미결 | [L1] BACKLOG 22행 |
| 스냅샷 수 | **상한 없음 · 삭제 불가**(2a-05 5.11), 화면은 최근 10개 + 더 보기 | [L1] 2a-05 SPEC 175행, `memoryDocBook.ts` 삭제 메서드 없음 |
| 스냅샷 1개 | 문서 전체 사본(`ProjectSnapshot.doc`) | [L1] `projectRepository.ts:96-108` |
| PageDoc JSON 1개 | 수 KB~수십 KB | [추정] 섹션 ≤ 십여 개 × 슬롯 텍스트 |
| 문서 안 이미지 | 로컬 id 문자열만 — blob:/data:/외부 URL 금지 | [L1] `engine/contracts/pageDoc.ts:44-55` |

→ 영속 시 지배 용량은 **이미지 Blob**(프로젝트당 최대 60MB 근처)이고, 문서·스냅샷 JSON은 작다(스냅샷 무한 누적은 장기 위험).

## 3. 직렬화·버전 필드

- PageDoc: `projectId·revision·hash·profileVersion·candidateId·libraryVersion·generatorVersion·meta·sections·updatedAt` (`pageDoc.ts:82-98`). **문서 스키마 버전 필드(`schemaVersion`) 없음** — `libraryVersion`·`generatorVersion`은 생성 재현용이지 저장 형식 버전이 아니다.
- 모든 상태 객체는 `deepFreeze`된 plain object + `Map` (`studioStore.ts:719`) — JSON 직렬화 가능(Map → 배열 변환 필요). 이미지는 `Blob` — JSON 불가(IndexedDB structured clone은 가능 [사실: 웹 표준]).
- 시각 = ISO 8601 문자열, id = 순번(`profile-N`, `snapshot-N`, `export-N`) — **순번 id는 store 새로 만들 때 1부터** → 영속 복원 시 카운터도 복원해야 충돌 0.
- 이미지 로컬 id 발급·비재사용 규칙 = 2a-05 5.9 (m2c SPEC 98행).

## 4. 동시성 규칙

- 문서: `saveDoc(expectedRevision)` If-Match — 불일치 `STALE_DOC`(최신 동봉), 멱등 키 (revision, hash) (`memoryDocBook.ts` save).
- 충돌 해결 `resolveConflict(mine|theirs)` = 보존 스냅샷 + 저장 한 트랜잭션 (`memoryDocBook.ts` resolveConflict).
- 프로젝트 이름 `STALE_PROJECT`, 프로필 `STALE_PROFILE`(expectedLatest), 보드 `STALE_BOARD`(revision).
- 원자성: `transact`(동기 draft → 마지막에 state 교체), DocBook은 `commit()` 뒤에만 state 교체 — **현재는 단일 탭 단일 스레드라 경쟁은 주입 테스트로만 재현**. 다중 탭 = 서로 다른 store라 지금은 경쟁 자체가 없음(영속 도입 시 새로 생김).
- 오류 코드에 `NETWORK`·`INFRA` 이미 있음(`projectRepository.ts:14-26`) — 비동기 저장 실패 경로가 화면에 있음(SaveStatus 재시도).

## 5. 기존 결정·예산

- ADR-001: 독립 저장소, "백엔드는 인터페이스를 유지한 채 이후 단계에서 붙인다", AOS 변경 0. TRD 16-17·74행은 AOS PostgreSQL(`design_studio` 스키마)·shared-infra를 전제한 v0.2 — ADR-001이 "AOS 의존 부분 개정" 대상으로 둠.
- MQ-C2 ★A 탭 메모리(B = IndexedDB +0.5~1주 [추정]) · MQ-S1 ★A: "이미지만 IndexedDB는 새로고침 생존 이득 0 — 문서 영속과 같이 가야 의미" · MQ-R1 ★A: 메모리 스냅샷, "백엔드(문서 영속)는 별도 ADR".
- BACKLOG B-M2C-03: 새로고침 시 프로젝트 자체가 사라짐. B-M2C-01: HTML_MAX < 30MB.
- ADR-004 개정 8 배분 끝: `/studio` 진입 기준선 128.55 · 판정선 128.58 · 상한 128.67(판정선 128.70) · 한도 129 · 최근 실측 128.51 (`app/scripts/m2cBaseline.json`, `dev/active/m3p-7/JARVIS_FINAL.md:4`). **여유 0.07KB** — 진입 청크에 저장소 코드를 넣을 자리 없음.
- 예산 측정 방식: "진입 직후" = 첫 화면 + 조작 없이 받는 dynamic import의 정적 closure(`app/scripts/check-bundle-size.mjs:6·90`) — 지연 청크라도 진입 자동 로드면 예산에 든다.
- 순번 id 추가: `project-${length+1}`(`memoryBoardConfirm.ts:142`). 프로젝트 삭제 메서드 없음(`projectRepository.ts:141-164`).
- 이미지 변형본은 항상 `deps.encode` 재인코딩(`ingestImage.ts:68-87`), 원본 `bytes`(97행)는 헤더 판독용 — 결과에 원본 Blob 없음.
- 가드: `app/src/test`에 `allow-same-origin`·`dangerouslySetInnerHTML` 금지 가드 없음(grep 0건).
- 진입 청크 규칙: 저장소 구현은 이미 동적 import(`deferredStudio`), 판정 본문은 조작 뒤 청크(`memoryDocBook`), 이미지 보관소는 "진입에 import 금지"(types.ts 3행).
- 보안 경계: 렌더 iframe `sandbox="allow-scripts"`(불투명 출처, `StructureCanvas.tsx:260`, `PreviewFrame.tsx:81`) — iframe 안 코드는 앱 출처 IndexedDB 접근 불가 [사실: 불투명 출처는 스토리지 접근 불가 — 웹 표준].
- PRD: FR-EDT-06 자동저장 30초 이내(P0), FR-CMP-04 조직 내 공유(P1), FR-PUB-06 미리보기 공유 링크(P1) — 공유 기능은 서버 전제.
