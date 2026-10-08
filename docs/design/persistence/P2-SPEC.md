# P2-SPEC — 프로젝트 파일 내보내기·가져오기 (형식·검증·상태·문구 명세)

- 작성 Designer(P2-SPEC 레인, base `6009271`) · 2026-10-08. 결정 정본(다시 묻지 않음): ADR-007 결정 요약 **P0 A (b) 파일 묶음 내보내기·가져오기(P2)** · **P4 A(JSON 1개 + 이미지 base64, 새 의존성 0)** · 5절 P2 행("id 재매김 · 검증 · 전부 아니면 전무 · 왕복 동일성") · 개정 1~3 · P1c·P1d 완료 기록. 재사용: `P1C-SPEC.md` 0절 원칙·1.6 지우기 흐름 · `P1D-SPEC.md` 1.3 삭제 흐름(잠금·한 트랜잭션·새로고침) · `THREATS.md` T4·T10 · `MQ.md` P4(최악 약 80MB [추정]).
- 예산(ADR-007 P1d 완료 기록): `/studio` **129.65 / 멈춤 >129.65 · 복원 132.68 / 멈춤 >132.68 — 여유 0** · `/profile` 첫 화면 **99.87 / 100** · `/projects` 104.86 / 125 · `/compare` 122.73 / 125.
- 근거 표기: [L1] 코드·문서 직접 확인(이 레인 grep·읽기) · [L3] 외부 일반 지식(네트워크 확인 안 함) · [추정] 측정 없음 · [확인 필요] 구현 레인이 1회 grep·실측.
- 브랜드: 기존 `Button`(primary·outline·assistive)·`Callout`·네이티브 `dialog`·토큰만. 새 아이콘·새 토큰·새 의존성·위험 variant 0. 목업 브랜드 명칭·`--apfs-*` 0.
- **MQ 0** — 이 SPEC의 선택은 모두 예산(진입 몫 0)·엔진 계약(변경 0)·새 의존성(0)·백엔드(0) 안이라 영환님 결정 항목이 없다. 그래서 `P2-MQ.md`는 만들지 않는다. ★ 표시는 Designer 판단(근거 병기)이며 Jarvis가 뒤집을 수 있다.

## 0. 코드로 확정한 사실 (설계 전제)

| # | 사실 [L1] | 설계 영향 |
|---|---|---|
| F1 | 지금 "내보내기"는 **렌더 결과물**이다: 편집기 `ExportButtons` "React 프로젝트(zip) 내보내기"·"정적 HTML 내보내기"(`components/studio/ExportButtons.tsx:11-12`) · `PngSave` "PNG 내려받기"(`PngSave.tsx:54`) · 잡 id `export-${size+1}` 탭 메모리 · 파일명 `<stem>_r<revision>.html`(`features/studio/staticHtml/exportFileName.ts:20`) | P2는 **편집기에 넣지 않고** `/projects`에만 둔다 · 이름은 늘 "**프로젝트 파일**"(단독 "내보내기" 금지) · 파일명 접미 `_r<n>.html`과 겹치지 않게(1.3) |
| F2 | 봉투 = `{ schemaVersion, kind, id, data }` · `SCHEMA_VERSION = 1` · `DB_NAME = "design-studio"` · 저장소 7개(`data/persistence/envelope.ts:5-8·11-17`). `checkEnvelope`은 ok·missing·mismatch(newer)·invalid(`envelope.ts:26-34`) | 파일 형식 = 이 봉투가 아닌 **파일 전용 봉투**(2절) — 앱 `schemaVersion`은 그 안에 기록만 하고 판정은 같은 규칙(newer = 거절) |
| F3 | IDB 값은 structured clone이라 **`Map`을 그대로** 저장한다: `StudioState.series·commits·adjustCommits·jobs·projects`(`data/studioStore.ts:36-47`) · 상태 레코드 `heads`(Map)·`gen`(`entryRead.ts:43-47`) | JSON은 Map을 못 담는다 → 파일에는 **배열**로 쓰고 가져올 때 Map으로 되돌린다 |
| F4 | 문서 레코드 `docs/<projectId>` = `{ doc, snapshots, snapshotSeq? }`(`entryRead.ts:49-54`) · 열기 검증 `readDoc` = 봉투 + `snapshotSeq` 정수 + **문서·모든 스냅샷 doc에 `checkSaveDoc(id, doc)`**(`localSync.ts:68-75`) · `checkSaveDoc` = `validatePageDoc` + **`projectId` 일치 + `hash === hashDoc(내용)`**(`data/startDocWrite.ts:93-98`) · `hashDoc`이 빼는 것은 `hash·revision·updatedAt`뿐(`engine/ops/hash.ts:36-40`) → **`projectId`는 해시 대상** · `getAll("docs").map(readDoc)`이라 **레코드 1건이 깨지면 싱크 열기 전체가 INFRA**(`localSync.ts:108`) | 새 projectId로 바꾸면 **doc·각 스냅샷 doc의 `hash`를 다시 계산**해야 한다(3.4). 가져오기 결과는 반드시 `readDoc`을 통과해야 한다(AC-P05) — 아니면 모든 프로젝트 열기가 깨진다 |
| F5 | 상태 열기 검증 `checkState` = `seq` 정수 · 계열 버전 1..n 연속·`ProfileVersion.profileId` = 계열 키 · 프로젝트 이름 `validateProjectName` 결과와 **정확히 같음** · 잡은 `readJobRecord`(zod)(`localSync.ts:56-66`) | 가져온 계열·프로젝트도 이 규칙을 통과해야 한다(3.3 ④) |
| F6 | 이미지 레코드 키 = `projectId/localId`(`imageRecord.ts:20`) · 값 = 변형본 Blob 전부 + `width·height·format·bytes` · 읽기 검증 `readImageRecord` = 형식 jpeg·png·webp · 변 1..16384 · 픽셀 4천만 이하 · 변형본 키 = `widthLadder(width)` · `bytes` = 변형본 합 · 각 변형본 머리 16바이트 `formatFromMagic` = format(`imageRecord.ts:26-43` · `ingest/limits.ts:5-9`) | 가져오기 이미지 검증 = **이 규칙 그대로** + 디코드 확인(3.3 ⑤). 키 접두만 새 projectId로 |
| F7 | 이미지 한도(2a-05 5.9): 문서 12개·30MB · **프로젝트(탭) 24개·60MB**(`features/studio/images/store/imageStore.ts:15-19`) · 원본 파일 1개 10MB는 고르기 단계 한도이고 저장되는 것은 재인코딩 변형본(ADR-007 사실 8) | 가져오기 한도 = 레코드 수 ≤ 24 · `bytes` 합 ≤ 60MB(3.3 ⑤) |
| F8 | 순번 id: `nextSeqId(prefix, ids, deletedMax)` = max(현존 최대, 묘비) + 1(`data/seqId.ts:6-12`) · 묘비 `seq{project,profile,job}`은 상태 레코드 안(ADR-007 개정 3) · 스냅샷 id·`snapshotSeq`는 **프로젝트 범위**(P1D-SPEC 3절) | 가져오기 = 발급이지 삭제가 아니다 → 대상 `seq`는 그대로, 새 id만 `nextSeqId`로(3.4) |
| F9 | 프로젝트 삭제 흐름 선례: IDB **직접 한 트랜잭션**(`studio·docs·images·meta` readwrite) · 트랜잭션 안에서는 IDB 요청만 await · `gen` = meta generation + 1 · 잠금 = `tabLockHold`(쓰기 탭이면 보유 잠금 · 아니면 tryLock · 못 잡으면 busy · 쓰기 탭이면 `own.stop()`) · 성공 = `sessionStorage` 1회 키 → `/projects` 새로고침 · **`envelope`·`entryRead`·`idbPersistence`·`studioStore` 값 import 금지(리터럴 복제 + parity 테스트)**(`features/projects/deleteProject.ts:1-10·88-122` · `tabLockHold.ts:39-60`) | 가져오기 쓰기는 이 흐름을 **그대로 복제**한다(3.5). 새 잠금·새 메시지 종류 0 |
| F10 | `/projects` 조작 뒤 청크 패턴: `ClearDialogSlot = lazy(() => import("./ClearDataDialogSlot"))`(`BrowserStorageSection.tsx:33`) · `DeleteDialogSlot = lazy(…)`(`pages/ProjectsPage.tsx:21`) · 줄 행동 = "편집기 열기"·"프로필 보기"·"이름 바꾸기"·"삭제"(local만, `data-delete-for`)(`ProjectRow.tsx:49-62`) · "이 브라우저 저장소" 영역 h2 + `role=status` "저장소 알림" + "이 브라우저 데이터 지우기"(`BrowserStorageSection.tsx:159-205`) · "프로젝트 알림" `role=status`(`ProjectsPage.tsx:194`) | 진입 위치·알림 영역·Slot 모양을 그대로 쓴다(1절·4절) |
| F11 | 파일명 정리 `exportFileStem(name)` = NFC · 금지·제어 문자 `-` · 40 코드 포인트 · 빈 값 `page` · Windows 예약 이름 회피(`exportFileName.ts:5-17`) | 프로젝트 파일 이름도 이 함수(1.3) |
| F12 | 예비 문장 2개가 P2 출시를 기다린다: 지우기 대화상자 "지우기 전에 '프로젝트 파일로 내보내기'로 백업할 수 있습니다."(P1C-SPEC 1.6 — **숨김**) · 프로젝트 삭제 J-S13 캡션 같은 문장(P1D-SPEC 8절) | L3에서 켠다(7절) — 버튼 이름에 맞춰 문장 조정(5절 FX-1) |
| F13 | 보드 확정 멱등 키 = `[board.id, revision, expectedLatest, target, callerSeries].join("\n")`(`memoryBoardConfirm.ts:82-83`) — `board.id`는 탭 메모리 비교 보드(영속 범위 밖, P1C-SPEC 0절 5) | `commits`·`adjustCommits`는 다른 탭·다른 브라우저에서 다시 쓰일 수 없는 재시도 기록 → **내보내지 않는다**(2.3). 소비처는 재시도 판정뿐: `commitOf` = 보드 확정 replay(`memoryBoardConfirm.ts:86`) · `adjustCommitOf` = 조정 저장 replay, 키에 profileId 포함(`memoryProfileAdjust.ts:44-46`) |

## 1. 범위 · 진입 위치 · 파일 이름

### 1.1 단위 — ★ 프로젝트 1개 = 파일 1개

| 안 | 내용 | 판단 |
|---|---|---|
| **★ A 프로젝트 1개** | `/projects` 줄마다 "파일로 내보내기" · 가져오기는 파일 1개 = 새 프로젝트 1개 | ADR-007 초안 (b) 데이터 모델 "프로젝트 1개 = 파일 1개"와 같음 · 파일 크기 상한이 프로젝트 이미지 한도(60MB)로 묶여 최악 약 80MB [추정 — base64 ×4/3 L3] · 가져오기가 **추가만**(기존 프로젝트 무접촉) · 기기 이동·공유 단위와 맞음 · 실패 범위가 1개 |
| B 전체 브라우저 데이터 | 저장소 영역에 "전부 내보내기" 1개 | 상한 없음(프로젝트 N × 80MB → 메모리 피크가 수백 MB [추정]) · 가져오기가 "합치기 vs 바꾸기" 정책을 새로 요구 · 묘비 `seq`·세대 등 브라우저 내부 상태가 파일에 섞임 |

- B가 주는 "한 번에 백업"은 A를 프로젝트 수만큼 누르면 된다(프로젝트 수가 적은 지금 단계 [추정]). 여러 개 한꺼번에는 8절(정하지 않는 것).

### 1.2 진입 위치

| 조작 | 위치 | 근거 |
|---|---|---|
| **내보내기** | `/projects` 줄 행동 맨 뒤(**"삭제" 앞** — 파괴 버튼을 맨 끝에 두는 기존 순서 유지)에 `Button variant="outline" size="sm"` **"파일로 내보내기"** · `aria-label` **"{이름} 파일로 내보내기"** · `data-export-for={projectId}`(포커스 복귀) · **local일 때만**(1.4) | 프로젝트 단위 조작은 줄에 있다(이름 바꾸기·삭제 선례 F10) · 편집기 "더보기"는 실행 취소 전용 [L1 P1C-SPEC 1.6] · 편집기 내보내기(렌더 결과물, F1)와 화면을 분리 |
| **가져오기** | `/projects` "이 브라우저 저장소" 영역, "이 브라우저 데이터 지우기" **앞**에 `Button variant="outline" size="sm"` **"프로젝트 파일 가져오기"** | 특정 줄에 속하지 않는 "새 프로젝트 추가" · 저장소 영역이 이미 브라우저 데이터 조작 자리(P1c MQ-C1 A) · 프로젝트 0개일 때도 보임 |
| 편집기·`/profile`·`/compare` | **없음** | 진입 몫 0(5절) · 렌더 내보내기와 혼동 방지 |

### 1.3 파일 이름 · 확장자

- 이름: **`${exportFileStem(이름)}_project_${YYYYMMDD}.json`**(내보낸 날, 사용자 로컬 시각). 예: `강남-카페_project_20261008.json`.
  - `_project_`가 렌더 내보내기 `_r<n>.html`(F1)과 구분한다 · 같은 날 여러 번 내보내면 브라우저가 이름 뒤에 번호를 붙인다 [L3].
- 확장자 `.json` · Blob type `application/json`. 새 확장자(`.dsproj` 등)는 OS 연결·미리보기 도구가 없어 사용자가 내용을 확인할 수 없다 — `.json` ★.
- 가져오기 선택기: `<input type="file" accept=".json,application/json">`(숨김, 버튼이 `click()`). **accept는 편의일 뿐 검증이 아니다** — 3.3 순서가 판정한다.

### 1.4 저장 상태별 노출

| 상태(P1c 1.7·1.8) | 내보내기 | 가져오기 |
|---|---|---|
| local 정상 | 보임 | 보임 |
| local 읽기 전용·낡은 탭 | 보임(읽기만 — 잠금 불필요) | 보임 → 쓰기 단계에서 busy면 IM-9(3.5) |
| memory(IndexedDB 없음·열기 실패·버전 불일치·깨진 봉투) | **숨김** — 내보낼 원본(IDB 레코드)이 없거나 읽을 수 없다(8절 한계) | **숨김** — 쓸 곳이 없다. 저장소 영역의 기존 강등 문장이 사유를 말한다 |

## 2. 파일 형식 (formatVersion 1)

### 2.1 최상위 봉투

```json
{
  "format": "design-studio-project",
  "formatVersion": 1,
  "schemaVersion": 1,
  "exportedAt": "2026-10-08T09:12:33.000Z",
  "project": { …Project },
  "series": [ …ProfileVersion ],
  "doc": { "doc": …PageDoc, "snapshots": [ …ProjectSnapshot ], "snapshotSeq": 3 } | null,
  "images": [ { "localId": "…", "width": 1920, "height": 1080, "format": "webp", "bytes": 123456,
                "variants": { "640": "<base64>", "1280": "<base64>", "1920": "<base64>" } } ]
}
```

| 필드 | 뜻 | 검증(3.3) |
|---|---|---|
| `format` | 고정 문자열 `"design-studio-project"` | 정확히 같음 — 아니면 IM-2 |
| `formatVersion` | **파일 구조** 버전(정수). 이 SPEC = 1 | 정수 1 · 1보다 큼 = IM-3(더 새 앱) · 그 밖 = IM-2 |
| `schemaVersion` | 내보낸 앱의 **레코드** 버전(F2 `SCHEMA_VERSION`) | 정수 · 앱보다 큼 = IM-3 · 작음 = 이행 함수(지금 0개 → v1만 있음, 장래 IDB 이행과 같은 순수 함수) · 같음 = 통과 |
| `exportedAt` | ISO 8601 | 문자열 · 화면 요약에만 쓴다(판정 0) |
| `project` | `Project`(projectId·name·revision·profileId·baseReferenceId·createdAt·updatedAt — `data/projectRepository.ts:29-41`) | 3.3 ④ |
| `series` | 그 프로젝트 계열(`project.profileId`)의 **모든 버전**, 오름차순 | 3.3 ④ (F5) |
| `doc` | 문서 레코드(F4) 또는 `null`(편집 문서를 아직 만들지 않은 프로젝트) | 3.3 ④ (F4) |
| `images` | 그 프로젝트 `images` 레코드 전부(`projectId/` 접두, F6) — Blob → base64(패딩 있는 표준 base64, 줄바꿈 0) | 3.3 ⑤ |

- 순서·공백: `JSON.stringify` 기본(들여쓰기 0). 키 순서는 판정에 쓰지 않는다.

### 2.2 버전 정책

- `formatVersion`은 **파일 구조가 바뀔 때만** 올린다(필드 이름·위치·인코딩). 선택 필드 추가는 올리지 않는다(옛 앱은 모르는 필드를 무시 — `snapshotSeq` 선례, P1D-SPEC 3절).
- `schemaVersion`은 안의 레코드(PageDoc·ProfileVersion 등) 모양을 따라간다 — IDB 봉투와 같은 값·같은 이행 함수(ADR-007 초안 (b) "형식 이행").
- **미래 버전(둘 중 하나라도 앱보다 큼) = 거절 + 쓰기 0**, 문장 IM-3. 낮은 버전 파일은 장기 호환 의무(ADR-007 6절 "되돌려도 남는 부채").

### 2.3 내보내지 않는 것

| 항목 | 이유 |
|---|---|
| `seq` 묘비 · `gen` · `meta`(`generation`·`firstSaveNotice`) | 브라우저마다의 내부 상태(F8·개정 2 보충) — 가져오는 쪽 값을 쓴다 |
| `heads`(문서 머리) | `doc`에서 다시 만든다(3.5 — 목록 `hasDoc`) |
| 잠금·쓰기 탭 여부·BroadcastChannel | 탭 수명 |
| `commits`·`adjustCommits`(멱등 재시도 기록) | 소비처가 재시도(replay) 판정뿐이고 키에 탭 메모리 `board.id`·옛 profileId가 들어가 가져온 곳에서 다시 맞을 일이 없다(F13 [L1]) — 없으면 첫 확정·조정이 새 기록을 만든다(기존 첫 실행과 같음) |
| `jobs`(생성 잡 StoredJob) | ★ 제외 — 키 `(profileId, version, libraryVersion, generatorVersion)`(`studioStore.ts:21-27`)를 새 profileId로 다시 써야 하고 `hidden`(아직 안 드러낸 결과)까지 파일에 실린다. 생성은 결정적(ADR-007 부록 1)이라 다시 만들면 같은 3안. 잡이 없는 `/profile` 진입 = 진입 때 `findJob`(store 조회)만 하고 결과 없음 → **"3안 만들기" 버튼**(사용자 조작 뒤 `requestGeneration`) [L1 `features/profile/useGeneration.ts:3·70-74·127` · `scripts/check-bundle-size.mjs:113-119` "잡 없는 진입은 위 /profile이 잰다"] — 이미 실측된 `/profile` 99.87 시나리오 그대로라 예산 영향 0. 대가: 가져온 프로젝트의 프로필 화면은 3안을 한 번 다시 눌러 만든다(EX-4가 고지) |
| 비교 보드·보관함(저장한 레퍼런스) | 영속 범위 밖 탭 메모리(P1C-SPEC 0절 5) |
| 렌더 내보내기 잡·`downloadRef`(blob: URL)·object URL | 탭 수명(F1) |
| 다른 프로젝트·다른 계열 | 범위 = 프로젝트 1개(1.1) |
| 원본 사진 바이트·EXIF | 원래 저장하지 않음 — 저장분은 재인코딩 변형본(ADR-007 사실 8) |

## 3. 가져오기 규칙

### 3.1 흐름 요약

파일 선택 → (대화상자 열림·"확인하는 중…") → **검증 3.3 전부**(쓰기 0) → 요약 표시 → 사용자가 "가져오기" → 잠금(3.5) → **IDB 한 트랜잭션** → 커밋 확인 → `saved` 알림 → `sessionStorage` 1회 키 → `/projects` 새로고침 → "프로젝트 알림" 1회.

### 3.2 크기 상한

- **파일 96MB 이하**(`file.size`, 읽기 전에) — 근거: 이미지 60MB × 4/3(base64) = 80MB [L3·추정] + 문서·스냅샷 JSON 여유 16MB [추정 — 스냅샷 수십 개 × 수십 KB]. 넘으면 IM-1, 파일을 읽지 않는다.
- 빈 파일(0바이트) = IM-2.
- 메모리 피크: 텍스트 1벌 + 파싱 객체 + base64 디코드 바이트 [추정 최악 수백 MB]. 줄이는 규칙: ① 문자열은 한 번만 만든다(`file.text()`) ② 이미지 base64는 **변형본 1개씩** 디코드해 Blob으로 바꾸고 문자열 참조를 끊는다 ③ 내보내기는 큰 문자열 1개를 만들지 않고 **조각 배열 → `new Blob(parts)`**. 실측은 AC-P10(작은 파일)만 — 큰 파일 피크 실측은 8절.

### 3.3 검증 순서 (앞 단계 실패 = 뒤 단계 0 · 전부 트랜잭션 **전** · 쓰기 0)

| 단계 | 검사 | 실패 문장 |
|---|---|---|
| ① 크기 | 0 < `file.size` ≤ 96MB | IM-1(초과) · IM-2(0) |
| ② 파싱 | `await file.text()` → `JSON.parse` · 최상위가 객체 | IM-2 |
| ③ 봉투 | `format` 정확히 일치 · `formatVersion`·`schemaVersion` 정수 · 미래 버전 판정(2.2) · `exportedAt` 문자열 · `project` 객체 · `series` 배열 · `doc` 객체 또는 null · `images` 배열 | IM-2 · 미래 = IM-3 |
| ④ 레코드 모양 | `project`: 문자열 필드·`revision` 정수 · `validateProjectName(name)` 결과가 정확히 같음(F5) · `project.profileId` 문자열. `series`: 비지 않음 · 버전 1..n 연속 · 모든 `profileId === project.profileId`(F5 규칙 — 계열 1개). `doc`: `snapshots` 배열 · `snapshotSeq` 없음 또는 안전 정수 · doc·각 스냅샷 doc **원래 id로** `checkSaveDoc(project.projectId, doc).ok`(F4) · 각 스냅샷 `projectId === project.projectId`·`snapshotId` 문자열·`kind` 알려진 값 · `doc.profileVersion` ≤ series 길이 | IM-4 |
| ⑤ 이미지 | 레코드 수 ≤ **24** · `bytes` 합 ≤ **60MB**(F7) → 각 레코드: `localId` 문자열(`/` 없음) · 중복 0 · base64 엄격 디코드(문자 집합·패딩 — `atob` 예외 = 실패) → `new Blob([bytes], { type: "image/" + format })` → **`readImageRecord`와 같은 규칙**(F6: 형식·변·픽셀·사다리·bytes 합·머리 서명) → 각 변형본 **`createImageBitmap` 디코드 성공 + 폭 = 사다리 값**(그 뒤 `bitmap.close()`) | 한도 = IM-5 · 그 밖 = IM-6 |
| ⑥ 참조 | 문서 ∪ 스냅샷 참조 집합(`recordRefs`와 같은 규칙, F6) **밖** 이미지 = 버림(쓰지 않음 — 거절 아님) 또는 단계 생략(L1 택1 — 6절) · 참조인데 파일에 없음 = 그대로(기존 "잃은 이미지" 경로) | — |

- **MIME 판정은 파일·Blob이 말하는 type을 믿지 않는다** — 바이트 머리 서명(`formatFromMagic`)과 디코드 결과만 믿는다. Blob type은 우리가 format에서 정해 붙인다.
- ★ **재인코딩 0**(THREATS T4 "디코드·재인코딩 재통과"와 다름 — 사유): 저장분은 이미 이 앱이 재인코딩한 변형본이고, 디코드 성공·치수·서명·크기 규칙이 악성 바이트 표면을 막는다. 재인코딩하면 왕복 바이트가 달라져 ADR 5절 P2 관문 "왕복 동일성"을 바이트로 확인할 수 없다. 디코더 자체 취약점은 T4 잔여 위험(브라우저 몫) 그대로.
- 문서 텍스트는 렌더 iframe(`sandbox="allow-scripts"`, 불투명 출처)과 렌더러 이스케이프가 다룬다(THREATS T1·T2) — 가져오기에서 추가 처리 0. 앱 쪽 `dangerouslySetInnerHTML` 0 유지.

### 3.4 id 재매김 — ★ 항상 새 id 발급 (덮어쓰기 없음)

| 안 | 판단 |
|---|---|
| **★ A 항상 새 id** | 가져오기 = 언제나 "새 프로젝트 추가". 기존 데이터 무접촉 → 실패·오조작 범위 0 · 같은 파일을 두 번 가져오면 프로젝트 2개(사용자가 지우기로 정리 — P1d) · 판정이 단순(충돌 분기 0) |
| B 같은 id면 덮어쓰기(확인) | 다른 브라우저에서 만든 `project-1`은 **같은 id여도 다른 프로젝트**다(순번 id — 출처 정보 없음) → 남의 프로젝트를 덮는 사고. 막으려면 전역 고유 id·출처 기록이 필요(형식·엔진 계약 확장) |

**치환 규칙**(트랜잭션 안, 대상 IDB 상태 기준 — 탭 메모리 기준 금지):

| 대상 | 새 값 |
|---|---|
| projectId | `nextSeqId("project", 대상 state.projects 키, 대상 seq.project)` (F8) |
| profileId | `nextSeqId("profile", 대상 state.series 키, 대상 seq.profile)` |
| `project` | `{ ...project, projectId: 새, profileId: 새, updatedAt: 가져온 시각 }` — `name`·`revision`·`createdAt`·`baseReferenceId` 그대로(목록 맨 위로 — 정렬 기준이 updatedAt [L1 `projectRepository.ts:39`]) |
| `series` 각 버전 | `profileId: 새` · 나머지 그대로 |
| `doc.doc` · 각 `snapshot.doc` | `projectId: 새` → **`hash = hashDoc(바뀐 doc)`**(F4 — projectId가 해시 대상) · `revision`·`updatedAt` 그대로 |
| 각 스냅샷 | `projectId: 새` · `hash: 그 doc의 새 hash`(스냅샷 `hash` = 만들 때의 `doc.hash` [L1 `memoryDocBook.ts:121·240`]) · `snapshotId`·`snapshotSeq` **그대로**(프로젝트 범위 F8) |
| 이미지 키 | `${새 projectId}/${localId}` — localId 그대로(문서 참조가 localId) |
| 대상 `seq` | **그대로** — 가져오기는 발급이지 삭제가 아니다(묘비는 삭제 때만, 개정 3) |
| 대상 `heads` | `+ 새 projectId → headOf(바뀐 doc)`(doc null이면 넣지 않음 — 목록 `hasDoc:false`) [L1 `localSync.ts:156`] |

- `hashDoc`은 engine 모듈이고 engine import 허용 목록은 `pages/StudioPage.tsx`·`components/studio/**`·`features/studio/**`·**`data/startDocWrite.ts`**·`render/**`·`kit/**`뿐 [L1 `engine/engineImportGuard.test.ts:27`] → `features/projectFile/`은 engine을 직접 부를 수 없다. **`data/startDocWrite.ts`에 순수 함수 1개(`rekeyDoc(doc, projectId)` = projectId 치환 + `hashDoc` 재계산)를 더해** 가져오기 청크가 그것과 기존 `checkSaveDoc`을 쓴다(startDocWrite = "편집 시작" onClick 조작 뒤 청크 — 진입 closure 밖 [L1 `engineImportGuard.test.ts:9`]).
- 재매김 뒤 **다시** ④의 검사(`checkSaveDoc(새 projectId, …)` · F5 규칙)를 돌려 통과해야 쓰기 단계로 간다 — 열기(`readDoc`·`checkState`)가 깨지면 모든 프로젝트가 INFRA(F4)라서 이중 확인.

### 3.5 쓰기 — 한 트랜잭션 · 다른 탭 차단 · 새로고침

1. **잠금**(F9 그대로): `tabLockHold(link, locks).acquire()` — 이 탭이 쓰기 탭이면 보유 잠금(이때만 `stop()` — 새로고침까지 쓰기 0) · 아니면 `tryLock` · 못 잡으면 **IM-9 busy**, 쓰기 0. `navigator.locks` 없음 = 잠금 없이 진행(어느 탭도 쓰지 않는 환경 — 개정 2 보충). 지우기 대기 중(`clearing`) = busy.
2. **트랜잭션** `studio·docs·images·meta` readwrite 1개. 안에서는 IDB 요청만 await: get `studio/state`·`meta/generation` → 상태 봉투 확인(mismatch·invalid = **IM-8**, abort) · 상태 없음(첫 실행·지운 직후) = 빈 상태에서 시작 → 3.4 계산(동기) → put state(`projects`·`series`에 추가 · `heads` 추가 · `gen` = generation + 1) · put meta generation(같은 값) · put `docs/<새 id>`(doc 있을 때) · put images(새 키). **연결은 쓰기 쪽과 같이 `open("design-studio", DB_VERSION=2)` + `onupgradeneeded = upgradeDatabase`로 연다**[L1 `data/persistence/idbPersistence.ts:3·13·20-26·62-63` — 조작 뒤 청크] — **새 브라우저로 옮겨 가져오기(이 기능의 주 용도)** 에서는 DB가 없거나 `/projects` 진입 읽기가 만든 저장소 0개 v1 DB만 있다(`entryRead.ts:4·27-35` [L1]). 버전 없이 열면(deleteProject 방식 `deleteProject.ts:89-92`) 저장소가 없어 쓸 수 없으므로 이 점만 deleteProject와 다르다. `upgradeDatabase`·`DB_VERSION`은 idbPersistence에서 import하거나(6절 규칙 — 실측) 복제 + parity. 상태 레코드가 없으면 빈 상태(맵 5개 비어 있음)에서 시작.
3. 실패: `QuotaExceededError` = **IM-11** · 그 밖 = **IM-10**. 전부 아니면 전무(트랜잭션 abort).
4. 커밋 확인 뒤 BroadcastChannel 기존 `{ type: "saved" }`(다른 `/projects` 탭 "다른 탭에서 저장한 변경이 있습니다") → `sessionStorage` 키 **`design-studio-imported`** = JSON `{ projectId: 새 id, name }`(이름만으로는 같은 파일 2회 가져오기의 같은 이름 줄을 구분 못 함 — IM-14) → **`/projects` 새로고침 이동**.
- **새로고침 ★ 이유**(P1c 1.6·P1d 1.3과 같음): 이 탭 메모리 store는 가져온 프로젝트를 모른다. 새로고침 없이 이어가면 이 탭이 다음 `saveState`로 **가져온 프로젝트가 빠진 상태를 덮어쓴다**(쓰기 탭인 경우) — 하이드레이션 경로를 그대로 타는 새로고침이 유일하게 새 코드 0인 길.
- 멈춘 뒤 실패(쓰기 탭에서 IM-10·IM-11): alert 끝에 **" 이 화면을 새로 불러옵니다."** · 대화상자를 닫으면 새로고침 이동(P1D 1.3 같은 이유 — 멈춘 싱크로 이름 바꾸기가 조용히 저장 0).
- **다른 탭 안전**: 세대 +1 → 다른 탭(낡은 메모리)은 첫 쓰기 때 최신성 확인 실패 = 낡은 탭(P1c 1.5) — 가져온 프로젝트를 덮는 경로 0.

### 3.6 내보내기 읽기

- IDB **readonly 한 트랜잭션** `studio·docs·images`: state·`docs/<id>`·`images` 중 `${projectId}/` 접두 키(P1d `projectImageKeys`와 같은 슬래시 접두 규칙) — 한 트랜잭션이라 문서·이미지가 같은 시점. 잠금 불필요(읽기만 · 다른 탭 쓰기와 무관).
- 원본 = **IDB에 커밋된 것**(저장된 마지막 상태). 다른 탭에서 저장 전 편집 중인 내용은 들어가지 않는다 → 대화상자 캡션 EX-4.
- 상태 봉투 mismatch·invalid = EX-6 · 그 프로젝트 없음(다른 탭이 지움) = EX-7.
- **자기 거절 파일 금지**(왕복 관문): 만든 파일에 가져오기 ①·⑤와 **같은 한도**(Blob 크기 ≤ 96MB · 이미지 ≤ 24개 · `bytes` 합 ≤ 60MB)를 적용 — 넘으면 내려받기 0, alert **EX-12**. 한도 상수는 가져오기와 같은 모듈 1곳(`features/projectFile/format.ts`).
- 만든 Blob → object URL → 부모 문서 `a[download]` 클릭(렌더 내보내기 `ExportAfter` 선례 [L1 `ExportAfter.tsx:68`]) → 내려받기 시작 뒤 `URL.revokeObjectURL`(다음 틱).

## 4. 화면 상태표

### 4.1 내보내기 (`/projects` 줄 "파일로 내보내기" → 조작 뒤 청크 대화상자)

| ID | 상태 | 표시·동작 | 알림·포커스 |
|---|---|---|---|
| X-S01 | 대화상자 열림 | 네이티브 `dialog` + `showModal()` · h2 **"'{이름}' 프로젝트를 파일로 내보낼까요?"** · 본문 EX-2 · 목록(ul): EX-3 항목 · 캡션 EX-4·EX-5 · 버튼 **취소**(outline) · **파일 만들기**(primary) | 열 때 포커스 = **파일 만들기**(비파괴 — 파괴 대화상자만 취소가 기본) · Esc = 취소 · 바깥 클릭 닫기 0 |
| X-S02 | 만드는 중 | "파일 만들기" `aria-disabled` + **"만드는 중…"** · 연타 무시(ref) · Esc 무시 | — |
| X-S03 | 큰 파일 경고 | 만든 Blob 크기 ≥ **50MB** [추정 — 메일·메신저 첨부 한도대 L3]면 내려받기 전 같은 대화상자에 캡션 EX-8 + 버튼 **내려받기**(primary)·**취소** | 포커스 = 내려받기 |
| X-S04 | 성공 | 내려받기 시작 → `dialog.close()` **먼저** → 포커스 = 그 줄 **"파일로 내보내기"**(`data-export-for`) | "프로젝트 알림" `role=status` **EX-9** 1회(새 알림 영역 0) |
| X-S05 | 실패 | 대화상자 유지 · 안 `role=alert` EX-6·EX-7·EX-10·EX-12 중 하나(시도마다 새로 낭독 — **alert key 패턴**: `<span key={시도 번호}>`, `ClearDataDialog` 선례) · 버튼 복귀 | alert 1회 |
| X-S06 | 취소 | `close()` 먼저 → 포커스 = 그 줄 "파일로 내보내기" | — |

### 4.2 가져오기 (저장소 영역 "프로젝트 파일 가져오기")

| ID | 상태 | 표시·동작 | 알림·포커스 |
|---|---|---|---|
| I-S01 | 파일 고르기 | 버튼 → 숨긴 `input[type=file]` `click()`. 고르기 취소 = 아무 일 없음 | 포커스 = 버튼 그대로 |
| I-S02 | 확인 중 | 파일을 고르면 대화상자 `showModal()` · h2 **"프로젝트 파일 가져오기"** · 본문 **"파일을 확인하는 중…"** · 버튼 **취소**만(누르면 확인 결과 버림) | 열 때 포커스 = **취소** |
| I-S03 | 요약(검증 통과) | 본문 IM-12(이름) · 목록: IM-13 항목(문서 유무·스냅샷 N개·이미지 N개·파일 크기·내보낸 날) · 캡션 IM-14 · 버튼 **취소** · **가져오기**(primary) | 포커스 = **가져오기**(추가만 — 비파괴) |
| I-S04 | 검증 실패 | 본문 대신 `role=alert` IM-1~IM-6 중 하나 · 버튼 **다른 파일 고르기**(outline — I-S01 다시) · **닫기** | alert 1회(key 패턴) · 포커스 = 다른 파일 고르기 |
| I-S05 | 쓰는 중 | "가져오기" `aria-disabled` + **"가져오는 중…"** · Esc 무시 | — |
| I-S06 | 차단·쓰기 실패 | 대화상자 유지 · `role=alert` IM-8~IM-11 · 버튼 복귀(재시도) · 멈춘 뒤 실패면 문장 끝 " 이 화면을 새로 불러옵니다." + 닫으면 새로고침 | alert 시도마다 1회 |
| I-S07 | 성공 | 3.5 ④ → 새로고침 뒤 "프로젝트 알림" `role=status` **IM-15** 1회(키 삭제) · 가져온 줄이 목록 맨 위(updatedAt) | 포커스 = 키의 **projectId 줄** 첫 행동("편집기 열기", 문서 없으면 "프로필 보기") — 줄 컨테이너에 새 `data-project-row={projectId}`로 찾는다(이름으로 찾지 않는다) · 키가 있을 때만 · 줄을 못 찾으면 h1(P1d J-S16) |
| I-S08 | 취소·닫기 | `close()` 먼저 → 포커스 = "프로젝트 파일 가져오기" 버튼 | — |

### 4.3 접근성 요약

- 대화상자 2종: 네이티브 `dialog` + `showModal()` · `aria-labelledby` = h2 · 바깥 클릭 닫기 0 · 진행 중 Esc 무시 · **닫을 때 `dialog.close()` 먼저, 그다음 상태 변경·포커스 이동**(P1c D4 — 열린 modal 밖은 inert라 언마운트 전 focus가 무시됨).
- alert = 대화상자 안 `role=alert` + **시도마다 key를 바꾼 자식**(같은 문장 재시도도 다시 낭독) · 성공 = 기존 "프로젝트 알림" status(새 라이브 영역 0, 저장소 영역 status와 겹치지 않게 결과는 "프로젝트 알림"에만).
- 줄당 버튼 5개("편집기 열기"·"프로필 보기"·"이름 바꾸기"·"파일로 내보내기"·"삭제") — 기존 `flex-wrap` 컨테이너 그대로, `size="sm"`(≥24 · 2.5.8). 390 폭 줄바꿈 [확인 필요 E].
- 숨긴 file input: `tabIndex=-1` · `aria-hidden` — 접근 가능한 조작은 버튼 1개.
- 진행 표시는 글자("만드는 중…"·"확인하는 중…"·"가져오는 중…")만 — 새 아이콘·스피너 0.

## 5. 문구 일람 (새 문자열 — 전부 `/projects` 페이지 또는 조작 뒤 청크)

| 키 | 문구 | 위치 |
|---|---|---|
| EX-1 | 파일로 내보내기 / {이름} 파일로 내보내기 | 줄 버튼 / aria-label |
| EX-2 | 이 프로젝트를 다른 브라우저나 기기에서 가져올 수 있는 파일 1개로 내려받습니다. | X-S01 본문 |
| EX-3 | 편집 문서와 스냅샷(문서 없으면 생략) · 문서에 넣은 이미지 · 확정한 프로필(모든 버전) | X-S01 목록 |
| EX-4 | 마지막으로 저장된 내용이 들어갑니다. 비교 보드·보관함·만든 3안은 들어가지 않습니다 — 3안은 가져온 뒤 프로필 화면에서 다시 만들 수 있습니다. | X-S01 캡션 |
| EX-5 | 파일에 이미지와 문구가 그대로 들어 있습니다 — 공유할 때 주의하세요. | X-S01 캡션(THREATS T10) |
| EX-6 | 저장된 데이터를 읽지 못해 파일을 만들지 못했습니다 — '이 브라우저 데이터 지우기'로 비울 수 있습니다 | alert(PJ-8 문형) |
| EX-7 | 이 프로젝트를 찾지 못했습니다 — 다른 탭에서 지웠을 수 있습니다. 새로고침하세요 | alert |
| EX-8 | 파일이 {N}MB입니다 — 메일이나 메신저로 보내기 어려울 수 있습니다. | X-S03 캡션 |
| EX-9 | '{이름}' 프로젝트 파일을 내려받았습니다 | 프로젝트 알림 |
| EX-10 | 파일을 만들지 못했습니다 — 다시 시도하세요 | alert |
| EX-11 | 파일 만들기 / 만드는 중… / 내려받기 / 취소 | 버튼 |
| EX-12 | 이 프로젝트는 가져오기 한도(파일 96MB · 이미지 24개 · 60MB)를 넘어 파일로 만들 수 없습니다 — 쓰지 않는 스냅샷을 지운 뒤 다시 시도하세요 | alert(3.6) |
| IM-0 | 프로젝트 파일 가져오기 | 저장소 영역 버튼 · I-S02 h2 |
| IM-1 | 파일이 너무 큽니다(최대 96MB) — 이 앱에서 내보낸 프로젝트 파일인지 확인하세요 | 검증 alert |
| IM-2 | 프로젝트 파일이 아닙니다 — 이 앱의 '파일로 내보내기'로 만든 .json 파일을 고르세요 | 검증 alert |
| IM-3 | 더 새 버전의 앱에서 만든 파일이라 가져올 수 없습니다 — 새로고침해 최신 앱을 받은 뒤 다시 시도하세요 | 검증 alert(P1c 1.8 newer 문형) |
| IM-4 | 파일 내용이 손상되어 가져올 수 없습니다 | 검증 alert |
| IM-5 | 이미지가 24개 · 60MB를 넘어 가져올 수 없습니다 | 검증 alert(imageStore 한도 문형) |
| IM-6 | 이미지를 읽지 못해 가져올 수 없습니다 — 파일이 손상되었을 수 있습니다 | 검증 alert |
| IM-7 | 파일을 확인하는 중… / 다른 파일 고르기 / 닫기 | I-S02·I-S04 |
| IM-8 | 저장된 데이터를 읽지 못해 가져오지 못했습니다 — '이 브라우저 데이터 지우기'로 비울 수 있습니다 | 쓰기 alert |
| IM-9 | 다른 탭에서 편집 중이라 가져오지 못했습니다 — 그 탭을 닫은 뒤 다시 시도하세요 | 쓰기 alert(PJ-7 문형 — 동사만 다름, 새 상수) |
| IM-10 | 가져오지 못했습니다 — 다시 시도하세요 | 쓰기 alert |
| IM-11 | 브라우저 저장 공간이 부족해 가져오지 못했습니다 — 쓰지 않는 프로젝트를 지운 뒤 다시 시도하세요 | 쓰기 alert |
| IM-12 | '{이름}' 프로젝트를 새 프로젝트로 추가합니다. | I-S03 본문 |
| IM-13 | 편집 문서 있음/없음 · 스냅샷 {N}개 · 이미지 {N}개 · 파일 {N}MB · {YYYY-MM-DD} 내보냄 | I-S03 목록 |
| IM-14 | 지금 있는 프로젝트는 바뀌지 않습니다. 같은 파일을 다시 가져오면 프로젝트가 하나 더 생깁니다. | I-S03 캡션 |
| IM-15 | '{이름}' 프로젝트를 가져왔습니다 | 프로젝트 알림(새로고침 뒤 1회) |
| IM-16 | 가져오기 / 가져오는 중… / 취소 | 버튼 |
| FX-1 | (예비 문장 켜기·수정) 지우기 전에 각 프로젝트의 '파일로 내보내기'로 백업할 수 있습니다. | `ClearDataDialog` 본문 · `DeleteProjectDialog` 캡션(J-S13) — F12의 "'프로젝트 파일로 내보내기'"를 실제 버튼 이름에 맞춤 |

- 조사: "{이름}를"·"{이름}을" 분기 0 — 기존 관례("스냅샷 '{이름}'를 저장했습니다")대로 따옴표 뒤 고정 조사(P1D-SPEC 2절).
- MB 표시 = `Math.ceil(bytes / 1024 / 1024)` 정수.

## 6. 번들 배치 — 모든 항목 진입 몫 0

| 항목 | 놓는 곳 | 진입 몫 | 근거 |
|---|---|---|---|
| 줄 "파일로 내보내기" 버튼 | `ProjectRow`(`/projects` 페이지 청크) | `/projects` 소폭 | `/projects` 104.86 / 125 — 여유 큼 · `/projects` 시나리오 = `ProjectsRoute` + 미리받기 + `PROJECT_AUTO`(`deferredStudio`·`memoryProjectRepository`) [L1 `scripts/check-bundle-size.mjs:50·127`] — `ProjectRow`는 `/studio`·`/profile` closure 밖 |
| 저장소 영역 "프로젝트 파일 가져오기" 버튼·숨긴 input | `BrowserStorageSection`(`/projects` 청크) | `/projects` 소폭 | 같음 |
| 내보내기 대화상자 + 읽기 트랜잭션 + JSON 조각·base64 인코딩 | 새 `ExportProjectFileSlot`(lazy — 누른 뒤) | **0** | F10 Slot 패턴 |
| 가져오기 대화상자 + 파싱·검증·디코드·재매김·쓰기 트랜잭션 | 새 `ImportProjectFileSlot`(lazy — 파일을 고른 뒤) | **0** | 같음 |
| 형식 상수·순수 함수(`features/projectFile/`) | 위 두 Slot만 import | 0 | — |
| 성공 알림 키 `design-studio-imported`·IM-15·EX-9 | `ProjectsPage`(리터럴 — `DELETED_KEY` 선례 `ProjectsPage.tsx:22`) | `/projects` 소폭 | — |
| FX-1 문장 | `ClearDataDialog`·`DeleteProjectDialog`(이미 조작 뒤 청크) | 0 | — |

- **"지연 import면 0"만으로는 부족하다**(P1d 완료 기록: 진입 closure를 안 바꾼 레인도 공유 청크 export 변동으로 ±0.02, 지금 여유 0.00). 그래서 새 모듈은 **진입·복원 closure 모듈을 값으로 import하지 않는다**: `data/deferredStudio`·`memoryProjectRepository`(`/studio`·`/projects` 진입 `PROJECT_AUTO` [L1 `check-bundle-size.mjs:50`]) · `data/persistence/envelope`·`entryRead`·`idbPersistence`·`localSync` · 복원 진입 자동 `imageRestore`와 그 정적 의존 `imageRecord`·`imageStore`·`ingest/fileType`·`ladder`·`limits` [L1 `check-bundle-size.mjs:145·150`] · `data/studioStore`. 필요한 상수(`"design-studio"`·`SCHEMA_VERSION 1`·저장소 이름·한도 24/60MB)는 **리터럴 복제 + parity 테스트**(`deleteProject.ts:9` 선례), 타입은 `import type`만.
  - 재사용 허용(조작 뒤 모듈): `data/seqId`(`nextSeqId`·`seqOf` — deleteProject가 이미 import [L1 `deleteProject.ts:15`]) · `exportFileStem`(렌더 내보내기 조작 뒤) · `tabLockHold`·`writerLock`·`tabLink`(deleteProject 선례) · `data/startDocWrite`(`checkSaveDoc`·새 `rekeyDoc` — 조작 뒤).
  - **진입 closure에 이미 있는 검증 함수**(`domain/projectName.validateProjectName` — `memoryProjectRepository.ts:10`로 진입 [L1] · `formatFromMagic`·`widthLadder`·`exceedsPixelLimit` — 복원 진입 [L1]): ★ **import 우선**(보안 검증 규칙의 원천을 둘로 만들지 않는다) — L1이 lazy 청크에서 import한 상태로 **관문 실측**하고, 진입·복원 수치가 하나라도 바뀌면(공유 청크 재분할) 그 함수만 리터럴 복제 + parity 테스트(같은 입력 표 → 같은 결과)로 바꾼다. 복제는 마지막 수단.
  - `recordRefs`는 `imageStore.retainedIds`에 묶여 있어(`imageRecord.ts:13·23`) 복원 closure — ⑥ 참조 판정은 **`retainedIds` 규칙을 복제하지 말고** 필요하면 ⑥을 생략(버림 없이 전부 쓰기 — 참조 밖 이미지는 다음 flush의 `imageOps`가 지운다 [L1 P1D F2])하는 안이 더 작다 → L1이 closure 확인 뒤 택1.
- **관문**(L1 첫 레인, 배선 전·후): `/studio` ≤ 129.65 · 복원 ≤ 132.68 · `/profile` ≤ 100 · `/projects`·`/compare` ≤ 125. 하나라도 넘으면 **멈추고 실측 보고**(KB 추정 금지 — ADR-007 사실 9).

## 7. QA 수용 기준

단위(vitest·메모리/가짜 IDB 의존성 0) = U · Ego Lite build+preview 실측 = E.

- **AC-P01 왕복 동일** — U: 시드 상태(프로젝트·계열 2버전·문서·스냅샷 3개(`snapshotSeq` 2 포함)·이미지 2개) → 내보내기 → 파싱 → 재매김 → 쓰기 계획: 문서·스냅샷 **projectId·hash 외 필드 동일**(canonical JSON 비교) · 이미지 변형본 **바이트 동일**(재인코딩 0) · series profileId 외 동일. E: 단색 PNG 1장 넣은 프로젝트 내보내기 → "이 브라우저 데이터 지우기" → 가져오기 → 편집기에서 문서·스냅샷 목록·이미지가 같다(이미지 Blob SHA-256 = 내보내기 전).
- **AC-P02 거절 = 쓰기 0** — U: 96MB+1 · 0바이트 · JSON 아님 · `format` 다름 · `formatVersion` 2 · `schemaVersion` 2 · `checkSaveDoc` 실패 doc · series 버전 구멍 · 이미지 25개 · 이미지 합 60MB+1 · base64 잘못된 문자 · 머리 서명 ≠ format · 사다리 불일치 · `bytes` 합 불일치 → 각각 IM-1~IM-6 정확한 문장 · **IDB 쓰기 호출 0**(트랜잭션 열지 않음). 짝: 내보내기 쪽 이미지 25개·합 60MB+1·Blob 96MB+1 시드 → EX-12 · 내려받기 0(자기 거절 파일 0). E: 손상 파일 1개(문자 하나 지움) → IM-2 또는 IM-4 · IDB 레코드 수 불변.
- **AC-P03 id 충돌** — U: 대상에 `project-1`·`profile-1` 있음 + 같은 id 파일 → 새 `project-2`·`profile-2` · 기존 레코드 **값 그대로** · 같은 파일 2회 = `project-2`·`project-3`. 묘비: 대상 `seq.project` 5(프로젝트 1개) → 새 `project-6`. 대상 `seq` 불변.
- **AC-P04 다른 탭 차단** — E: 탭 A 편집기에서 편집·저장(쓰기 탭) → 탭 B `/projects` 가져오기 → IM-9 1회 · IDB 그대로(레코드 수·generation 불변) · A 닫고 B 재시도 성공. U: `tabLockHold` 가짜 — busy · 쓰기 탭 `stop()` 뒤 실패 → 닫기 = 새로고침.
- **AC-P05 열기 무결** — U: 가져오기 결과 state·doc 레코드를 **`checkState`·`readDoc` 그대로 통과**(F4·F5 — 실패하면 모든 프로젝트 INFRA). E: 가져오기 뒤 새로고침 → 모든 프로젝트 편집기 열림.
- **AC-P06 한 트랜잭션** — U: 트랜잭션 실패 주입(put 중 abort) → state·docs·images·meta 전부 이전 값 · Quota 주입 → IM-11.
- **AC-P07 강등·불가** — U: memory 모드 = 두 버튼 숨김 · 상태 봉투 `schemaVersion: 99` → 내보내기 EX-6 · 가져오기 IM-8 · 쓰기 0.
- **AC-P08 화면·포커스** — E: 내보내기 열면 포커스 "파일 만들기" · Esc = 닫힘 + 포커스 그 줄 "파일로 내보내기" · 성공 EX-9 1회 · 가져오기 확인 중 → 요약 → 포커스 "가져오기" · 성공 새로고침 뒤 IM-15 1회 + 포커스 가져온 줄 "편집기 열기"(다시 새로고침하면 0회) · **같은 파일 2회 가져오기 → 두 번째 성공 뒤 포커스가 같은 이름의 앞 줄이 아니라 새 `project-3` 줄** · 검증 실패 alert 같은 파일 재선택 시 다시 낭독.
- **AC-P09 번들** — 6절 관문 수치(배선 전·후 표).
- **AC-P10 Ego Lite 범위** — 이미지는 **단색 PNG만**(외부 이미지·사진 0 — CLAUDE.md 권리 경계). 큰 파일(80MB) 메모리 피크는 실측하지 않는다(8절).
- **AC-P11 회귀** — P1D AC-D04·D05(삭제·차단) · P1C 지우기(C05) 재실행 통과 · FX-1 문장 표시.
- 정리(모든 E 뒤): `indexedDB.deleteDatabase("design-studio")` · 자기 탭·공간만 정리 · preview 종료.

## 8. Developer 레인 분할 (레인당 1~2건)

| 레인 | 범위(절) | 주 쓰기 파일 | AC | 선행 | 관문 |
|---|---|---|---|---|---|
| **L1 형식·검증·재매김(순수)** | 2절 · 3.2~3.4 · 6절 검증 함수·`upgradeDatabase` import 실측(복제 여부 결정) | 새 `features/projectFile/format.ts`(상수·타입·parity) · `checkFile.ts`(① ~ ⑥) · `rekey.ts`(3.4) · `encode.ts`(state → 조각 배열) + 각 `.test.ts` · `data/startDocWrite.ts`(`rekeyDoc` 1개 추가) | P01(U) · P02(U) · P03(U) · P05(U) | 없음 | 진입 파일 변경 0 → 관문 실측 1회(기준선 기록) |
| **L2 내보내기 화면** | 1.2 · 1.3 · 3.6 · 4.1 · EX 문구 | `ProjectRow.tsx`(버튼·`data-export-for`) · `ProjectList.tsx`(`onExport` 전달) · `ProjectsPage.tsx`(Slot·EX-9 — 겹침 아래) · 새 `components/projects/ExportProjectFileDialog.tsx`(+`Slot`) · 새 `features/projectFile/readProject.ts`(readonly 트랜잭션) | P01(E 앞반) · P07(내보내기) · P08(내보내기) · P09 | L1 | `/projects` ≤125 · `/studio`·`/profile` 불변 |
| **L3 가져오기 화면·쓰기** | 3.1 · 3.5 · 4.2 · IM 문구 · FX-1 · I-S07 알림·포커스 | `BrowserStorageSection.tsx`(버튼·input) · 새 `components/projects/ImportProjectFileDialog.tsx`(+`Slot`) · 새 `features/projectFile/writeImport.ts`(트랜잭션·잠금) · `ProjectsPage.tsx`(키·IM-15·포커스) · `ClearDataDialog.tsx`·`DeleteProjectDialog.tsx`(FX-1 한 줄씩) | P01(E 왕복) · P02(E) · P04 · P06 · P07(가져오기) · P08(가져오기) · P11 | L1 | 같음 |

- **병렬**: L1 먼저. 그다음 **L2 ‖ L3**, 단 **`ProjectsPage.tsx` 겹침 1건**: `ProjectList`는 알림 콜백이 없고 `onDelete`만 받으며(`ProjectList.tsx:15` [L1]) 삭제 Slot·"프로젝트 알림"이 `ProjectsPage`에 있다(`ProjectsPage.tsx:21·194` [L1]) → L2도 같은 모양(`onExport` + `ExportProjectFileSlot` + EX-9)으로 `ProjectsPage`를 고친다. 처리 = **L2 먼저 병합, L3는 `ProjectsPage` 수정을 레인 마지막 커밋으로 두고 L2 병합 뒤 rebase**(나머지 L3 파일은 겹침 0 — 처음부터 병렬). L2 파일 목록에 `ProjectsPage.tsx` 추가.
- 공유 상수 `BUSY` 문형: IM-9는 새 상수(동사 다름) — `features/projects/dialogText.ts`(P1d 공용)에 추가하면 L3 단독 파일.
- **턴 한도 대응**: L1이 가장 크다(검증 6단계 + 재매김) — 넘치면 L1a(format·checkFile ①~④) / L1b(⑤ 이미지·rekey·encode)로 나눈다(파일 겹침 0). E 실측은 L3 끝에 한 번에(왕복·차단·포커스) — L2는 U + 내려받기 1회 E.
- 각 레인 완료 기준: typecheck·lint·test·build + 해당 AC + 관문. TDD — AC-P02(거절 = 쓰기 0)·AC-P05(열기 무결)가 RED 출발점.

## 9. 바뀌는 문서 (행 목록만 — 본문 수정은 Jarvis/해당 레인, 이 레인 수정 0)

| 문서 | 바뀔 내용 |
|---|---|
| `docs/decisions/ADR-007-local-persistence.md` 5절 P2 행 | 정본 = 이 SPEC · 이미지 검증 "디코드·재인코딩" → "규칙 재검사 + 디코드 확인, 재인코딩 0"(3.3 사유) · id = 항상 새 id(3.4) |
| `docs/design/persistence/THREATS.md` T4 | 완화 "디코드·재인코딩 재통과" → 3.3 ⑤ 규칙(재인코딩 0 사유) · "기존 id와 겹치면 새 id" → "항상 새 id" |
| `docs/design/persistence/P1C-SPEC.md` 1.6 예비 문장 | 숨김 해제 + FX-1 문장 |
| `docs/design/persistence/P1D-SPEC.md` 8절 | J-S13 캡션 FX-1 추가 |
| `docs/design/2a-05/SPEC.md` J-S04(줄 행동) | "파일로 내보내기" 추가 · 저장소 영역 "프로젝트 파일 가져오기" |

## 10. 이 SPEC이 정하지 않는 것 (한계)

- **강등(memory) 상태의 내보내기** — 백업이 가장 필요한 상황(열기 실패·깨진 봉투)인데 IDB를 읽을 수 없어 불가. 탭 메모리에서 내보내는 경로는 store·DocBook 직렬화가 진입·복원 closure에 닿아(6절) 예산 0과 충돌 [추정] — 필요하면 별도 레인에서 실측 후 결정.
- 여러 프로젝트 한꺼번에(전체 백업) · 덮어쓰기 가져오기(1.1 B·3.4 B) · 생성 잡·멱등 기록 포함(2.3 — 제외 근거 [L1] 확인됨).
- 80MB 파일 메모리 피크 실측 · 파일 암호화·서명(위변조 탐지 — 검증 규칙이 모양만 본다) · 서버 업로드 형식 재사용(ADR-007 (c) 별도 ADR).
- 렌더 내보내기(HTML·React zip·PNG)와 화면 통합 — 그대로 별개.
