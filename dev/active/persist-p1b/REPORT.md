# PERSIST-P1b REPORT — 이미지 영속 · 새로고침/재진입 뒤 이미지 복원

## 판정 — 완료: 저장·자동 복원 구현 · `/studio` 진입 129.57 / 130(상한 129.60 이내) · Ego Lite 새로고침·재진입 이미지 유지 실측
- 커밋: P0 `8e66c23` · 구현 `4950ccb` · 기준선 "ADR-004 개정 9·10 배분 P1b" `6a2f87b`(129.57, base 4950ccb) · 가드 수정 `d987302`(engineImportGuard — 타입 전용, 번들 0).

## 구현
1. **저장** (`localSync.flush(projectId, book, images)` · `persistence/imageRecord.ts`)
   - 문서 레코드·상태 레코드와 **같은 트랜잭션**에 이미지 op — 큐 키 = projectId라 INFRA·재시도(`retry` 미확인 재제출)·"저장됨 = IDB 커밋 뒤"가 그대로 적용.
   - put = 참조 집합(`retainedIds(doc, undefined, 스냅샷 문서들)` — 5.9 함수 재사용) ∩ 편집 틀 맵 − 저장된 id. 레코드 = 변형본 Blob 전부 + width·height·format·bytes(`imageMeta`).
   - delete = 이 프로젝트(`projectId/` 접두사, 구분자 포함)의 저장 id 중 참조 집합 밖. 스냅샷이 참조하면 남는다.
   - 저장된 id 집합 = 싱크 열 때 `StudioPersistence.keys("images")`(IDB `getAllKeys`) 1회 + 제출마다 갱신.
   - 한도 판정 변경 0(추가 시 기존 `checkLimits` 그대로, 저장은 판정하지 않음).
   - **ADR과 다른 점 1줄**: ADR 3절 키 `[projectId, localId]`(배열)를 봉투 문자열 id `projectId/localId`로 인코딩(writeQueue 레코드 키·어댑터 키 = 봉투 id 규약).
   - 기록 시점 = 이미지를 넣은/지운 편집의 **문서 저장(자동 저장 2초 디바운스)** 트랜잭션 — 문서가 참조하는데 이미지가 없는 저장 상태를 만들지 않으려는 선택.
2. **자동 복원** (`persistence/imageRestore.ts`, 별도 청크)
   - 진입 트리거: StudioLayout effect 1개(`repository.images?.(projectId, images, setImages)`, deps에 images) + 로컬 저장소에만 있는 `images` 메서드(메모리 모드 = 없음, 동작 변화 0). 맵 없음(마운트) = 복원 시작, 그 밖 = 맵 등록(저장 트랜잭션용).
   - 복원 대상 = 저장된 문서·스냅샷 참조 집합(진입 레코드 또는 DocBook). 연결 1개로 단건 읽기.
   - 검증 = 저장 규칙 1:1: 봉투(kind·id·schemaVersion) · 형식 목록 · `widthLadder(width)`와 변형본 폭 일치 · 각 변형본 `formatFromMagic` = format · `MAX_SIDE`·`exceedsPixelLimit` · bytes = 변형본 합 · 조립 맵 `checkLimits`.
   - `addImage`(슬롯 `slotTarget`)로 메타 WeakMap 재구성 → `publish(prev ⇒ {...복원, ...prev})`(복원 중 사용자가 넣은 이미지 우선).
   - 실패(읽기 오류·불량 레코드·한도 밖) = 맵에 없음 → 기존 잃은 이미지 경로(QB-10) — 새 문구 0. 편집기 재진입 = 새 마운트라 같은 복원.

## 번들 (gzip KB, check-bundle 출력)
| 라우트 (한도) | 기준 a07ba59 | 현재 | 증가 |
|---|---|---|---|
| /studio/:projectId (130 · 상한 129.60) | 129.41 | **129.57** | +0.16 |
| /projects (125) | 101.20 | 101.35 | +0.15 |
| /compare · (조정 있음) (125) | 122.61 | 122.60 | −0.01 |
| /profile · (3안 있음) (125) | 119.86 · 122.33 | 119.84 · 122.32 | −0.02 · −0.01 |
| /catalog (101 · 125) | 100.05 / 102.39 | 100.05 / 102.39 | 0 |
| /references/:id | 97.30 / 99.64 | 97.30 / 99.64 | 0 |
| 렌더 JS (90) | 84.19 | 84.19 | 0 |
- 예산 스파이크(구현 전, 골격만): 129.54 → 최종 129.57.
- **Jarvis 결정 항목(차단 아님)**: 복원 청크는 사용자 조작 없이(effect, 로컬 영속일 때) 받는다 — 검사기 주석 규칙상 "자동"이지만 SCENARIOS에는 넣지 않았다(브리프: 예산 커밋은 기준선+테스트만). 진입 몫 밖 closure 실측 = imageRestore 0.62 + imageRecord 0.92 + imageStore 1.00 + ladder 1.14 = **약 3.68KB** → 셌다면 `/studio` 약 133.25(한도 130 초과). P1a의 "생성 중 새로고침 싱크 청크" 한계와 같은 성격. 처리안: (a) 지금처럼 조건부 자동으로 보고만 (b) 조건 시나리오 추가 + 예산 개정 (c) 복원 청크 감량.

## TDD
- 예측 PROGRESS → RED: imageRecord·imageRestore 모듈 없음 · 계약 `p.keys is not a function` · Blob `expected {} to be an instance of Blob` — 예측 일치. 어긋남 1: imagePersist는 첫 RED 실행(src/test 포함)이 출력 없이 멈춰 중단, RED 단독 확인 못 함. RED 커밋 0.
- GREEN: 새 테스트 imageRecord(10)·imageRestore(4)·imagePersist(5) + 계약 2건. 단언 약화·skip 0.
- jsdom `structuredClone`은 Blob을 `{}`로 잃는다(실측) → `src/test/setup.ts`에 Blob 있을 때만 동작하는 보존 래퍼(제품 코드 우회 0). **단위 테스트는 배선만 증명하고 실제 IDB Blob 생존은 Ego Lite만 증명한다.**
- 전체 1차 실행에서 engineImportGuard 실패 1건(새 data 모듈의 `import type PageDoc`) → `Parameters<typeof retainedIds>[0]` 타입 별칭으로 수정 `d987302`.

## Ego Lite (build + `vite preview --port 4337 --strictPort`, TaskSpace 22)
- 창 `windowState: "normal"`(조작 없음). 시작 `indexedDB.databases()` = [].
- `/references/ref-a` 상세 "비교 추가" → 보드 열기 → "이 레퍼런스로 프로필 만들기" → "프로필 확정 (v1)" → "3안 만들기 (v1)" → A안 선택 → "A안으로 편집 시작" → `/studio/project-1` → "이미지 편집 (1)" 펼침 → Hero 이미지 슬롯에 **스크립트 생성 단색 PNG 800×400**(`/tmp/p1b/img`, 저장소 밖) 업로드.
- 업로드 뒤: 슬롯 캡션 `800 × 400 · WebP 1KB` · **"이 브라우저에 저장됨 · 방금"** · IDB v2 `images` 키 `project-1/<uuid>` · 변형본 `640: image/webp 928B`, `800: image/webp 1132B` · 메타 `[800, 400, webp, 2060]` (`shots/1-uploaded-saved.png`).
- **새로고침 1회**(`page.reload()`, `/studio/project-1` 직접 진입): 캔버스 Hero에 파란 단색 이미지 표시(`2-after-reload-canvas.png`) · 슬롯 캡션 `800 × 400 · WebP 1KB`(형식 라벨 = 메타 WeakMap 재구성 증거) · "이미지를 다시 골라 주세요" 없음(`3-after-reload-slot.png`).
- 편집기 이탈("프로젝트로 돌아가기" → `/projects`) → "편집기 열기" 재진입: 캡션 동일 · 잃은 이미지 없음(`4-reentry-slot.png`).
- 정리: `deleteDatabase("design-studio")` = onsuccess → `databases()` = [] · `finish({keep:[]})` · `listTaskSpaces()` = [] · preview 종료, 4337 리슨 0. 새로고침 합계 1회. main 5480·영환님 창 무접촉.
- 캡처는 `page.cdp("Page.captureScreenshot", { captureBeyondViewport:false, clip })` 4장.

## 검증 (fresh, `d987302`)
| 명령 | 결과 |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0 · /studio 129.57 / 130 · 기준선 129.57 + 0.03 · 전 행 한도 안 |
| `npx vitest run` 전체 1회 | exit 0 · 263 파일 · 2297 테스트 |

## 남은 것 · P1c/P1d 입력
- 위 "Jarvis 결정 항목"(복원 청크 자동 분류).
- 이미지 기록은 문서 저장에 묶인다 — 이미지를 넣고 자동 저장 전(2초 안)에 탭을 닫으면 문서·이미지 모두 저장 전 상태(일관성 유지, 손실 범위는 기존 자동 저장과 같음).
- 맵 등록은 effect 뒤라 저장 시점에 맵이 늦으면 그 저장에는 이미지가 빠지고 다음 문서 저장이 채운다(문서가 바뀌지 않으면 재생 경로라 채우지 않음) [추정 — 실측에서는 발생 안 함].
- P1c: "이 브라우저 데이터 지우기"는 `images` 저장소 포함 필요 · 사용량 표시는 이미지가 지배. P1d: 프로젝트 삭제 시 `projectId/` 접두 이미지 레코드 함께 삭제 · 스냅샷 보존 정책이 이미지 정리(참조 집합)와 맞물림.
- Codex 실행 0(Jarvis 몫) · 엔진·PageDoc 계약·한도·포맷 판정·docs·lock·CLAUDE.md 수정 0 · 새 의존성 0 · 서브에이전트 0 · push/merge 0.
