# BUNDLE-HEADROOM + F1 + G — REPORT

- 작성: Hermes Developer · 2026-09-27 KST · 브리프 `docs/06-handoff/BUNDLE-HEADROOM_DEVELOPER_BRIEF.md`(`3c4d5c7`) · 작업 공간 `bundle-headroom`
- 결론: **H 목표 달성**(여유 `/compare` 0.41 → **6.02** · `/profile` 0.32 → **6.16**, 공통 JS 89.06 그대로) → **F1 완료**(Chromium 스모크로 D-2A4-01·02 복구 확인) → **G 완료**. 예산 상수·의존성 변경 0.
- 근거 수준: 번들·테스트·스모크 = L1(로그 파일) · WebKit·하위 청크 한계 = L2(추정, 실측 불가)

## 1. 커밋
| 해시 | 내용 |
|---|---|
| `919e838` | H-1 인벤토리 `logs/headroom-inventory.md` (코드 변경 0) |
| `9743b65` | H — 보드 입력 검증(`boardInput`·zod)을 조작 뒤 청크로 + 스크립트 분류 + 요청 0 테스트 |
| `a8c6dbf` | F1 — `retryableImport`(청크 실패 캐시 우회) + 배선 6곳 + 단위·배선·화면 테스트 |
| `f5362a3` | G — `noHardcodedStyle` 가드를 `src/styles` 컴포넌트 CSS까지(토큰 원본·`theme.css` 명시 제외) |
| `d0e09a3` | 스모크·RED/GREEN·게이트·5회 로그와 캡처 |
| (이 커밋) | REPORT |

## 2. H — 여유 확보
### 2.1 인벤토리 (요약, 전체 표는 `logs/headroom-inventory.md`)
- 두 라우트 진입 직후 closure에서 **첫 렌더에 필요 없고 미룰 수 있는 가장 큰 덩어리 = zod(+`boardInput`)**, 모듈 단독 gz 합 약 11.3.
  - `/compare`: `boardInput`을 쓰는 곳은 `savePicks`(선택·비우기·되돌리기·사용자 스타일·열 빼기·다시 시도 — 모두 조작 핸들러)와 `checkPrimaryColor`(대표색 blur·Enter)뿐.
  - `/profile`: 호출 0. `memoryStudio` → `memoryCompareBoardRepository`의 정적 import로만 끌려왔다.
- 나머지(초안 계산·경고·입력 틀·캡션·저장소 조회·픽스처)는 첫 렌더 필요. 저장소 구조(ADR-005 D3 store 이음새)·`zod` 교체는 후보에서 뺐다(규칙 ④·구조 변경).

### 2.2 이동과 전후 KB (gzip, 진입 직후 / 예산 125)
| 이동 | `/compare`·`(조정 있음)` | `/profile` | 공통 JS | 첫 화면(모든 라우트) |
|---|---|---|---|---|
| 전 (`3c4d5c7`) | 124.59 (여유 0.41) | 124.68 (0.32) | 89.06 | — |
| `boardInput`·zod → 조작 뒤 (`9743b65`) | **118.78** (−5.81) | **118.61** (−6.07) | 89.06 | ±0.01 |
- 방법: `savePicks`는 `writeBodyLoader.loadBoardInput`(기존 쓰기 본문 이음새)을 `call` 앞·동기 구간 밖에서 받는다(확정 본문과 같은 패턴). 대표색 검사는 `features/compare/boardInputLoader`로 받고, **필드 포커스 때 미리 받는다**(`checkPrimaryColor.prepare`, 조작 뒤) — blur·Enter 검사가 로드를 기다리지 않게.
- 함정(실측): `boardInput`이 공통 청크 모듈 `compareBoard`를 **런타임 import**하면(값 `PICKABLE_ROW_IDS`, 또는 `verbatimModuleSyntax`로 남는 `import { type … }`) rolldown이 `compareBoard`를 공통 청크에서 떼어 **공통 JS 89.34·모든 첫 화면 +0.26~0.29**가 된다. 그래서 `boardInput`은 `import type`만 쓰고 행 id는 호출자가 넘긴다(`parseBoardInput(picks, custom, rowIds)`). 가드: `boardInput.test` "공통 청크 모듈을 런타임 import하지 않는다".
- `savePicks`만 옮기면 `/compare` 125.21(예산 초과) — zod가 엔진 경로로 남은 채 청크만 갈라진다. 두 호출 지점을 함께 옮겼다.
- 스크립트 분류: `COMPARE_AFTER_ACTION`·`/profile afterAction`에 `src/domain/boardInput.ts` + 호출 경로 주석. 예산 상수 변경 0.
- 조작 뒤 크기 변화(예산 판정 밖): `boardInput` +6.61 신설 · `memoryProfileAdjust` `/compare` +2.08 → +7.99, `/profile` +1.74 → +7.65 — zod가 두 조작 뒤 청크의 공유 청크(`schemas`)로 옮겨 가서다. 총량은 같고 받는 시점만 "첫 조작 뒤"로 옮겨졌다.
- 사용자가 보는 변화: 첫 화면·진입 직후 정보 변화 0. 대표색 검사가 비동기가 됨(포커스 때 미리 받으므로 체감 지연은 실측에서 없음) · **새 실패 경로**: 검사 청크 로드 실패 → 필드 오류 "대표색을 확인하지 못했습니다. 잠시 후 다시 입력하세요"(저장 0, 다음 blur·Enter에서 다시 받음) — 설계 질문 1. 선택 저장 로드 실패는 기존 "저장하지 못했습니다 · 다시 시도" 그대로.
- 비동기 검사 안전장치: 기다리는 사이 입력이 바뀌면 옛 결과를 버리고, 저장은 그때의 최신 값·`onChange`로 한다(다른 선택을 옛 값으로 덮지 않게).

### 2.3 테스트 (RED → GREEN)
- RED 5건(의도한 이유로 실패, 출력은 세션 콘솔): `boardInput.test` "행 id 목록은 호출자가 넘긴다"(목록 밖 행 통과) · "공통 청크 모듈(compareBoard)을 런타임 import하지 않는다"(`import { PICKABLE_ROW_IDS, type … } from "./compareBoard"` 검출) · `BoardInputLoad.test` 3건(로더 호출 0/실패 경로 없음). → GREEN 60/60(관련 6파일), 전체 715/715.
- `src/pages/BoardInputLoad.test.tsx`
  - "/compare: 진입(보드·엔진·입력 틀까지)에 요청 0 → 선택 클릭 뒤 저장소 로더, 대표색 포커스 뒤 화면 로더"
  - "/profile: 진입(조회·범위 조회)에 요청 0"
  - "선택 저장: 로드 실패 → '저장하지 못했습니다' + 다시 시도, 보드 변화 0 → 다시 시도하면 저장됨"
  - "대표색: 로드 실패 → 필드 오류(확인 실패 문구)·저장 0 → 다시 포커스를 옮기면 검사해 저장"
- 기존 `DraftPanel.test` 대표색 2건(AC-14 등)은 수정 없이 통과.

## 3. F1 — 청크 재시도 (D-2A4-01 P2 · D-2A4-02 P3)
### 3.1 설계
- `app/src/data/chunkRetry.ts` `retryableImport(load, importUrl?)`: 첫 시도는 정적 `import()`(manifest·분류 유지), 실패하면 다음 호출은 같은 청크를 **새 URL `?retry=N`(매번 증가)**으로 받는다. 받은 모듈은 기억한다.
- **URL을 오류 문장이 아니라 로더 함수 소스에서 읽는다**: 빌드 출력의 로더는 `()=>i(()=>import(\`./memoryBoardConfirm-<해시>.js\`),__vite__mapDeps([…]))`라 청크 파일 이름이 우리 번들 안의 리터럴이다 → WebKit처럼 오류에 URL이 없어도 같은 방식으로 동작하고, 오류 문장 속 URL을 믿지 않으므로 출처·경로 검증이 필요 없다(`./이름.js` 모양만 받는다). 개발 서버·Vitest(`import("./x")`)는 새 URL을 만들지 않고 지금처럼 정적 `import()`를 다시 부른다.
- 재시도 상태는 **청크 파일별 모듈 수준 공유** — `boardInput`처럼 두 로더가 같은 청크를 받을 때, 한쪽이 `?retry=1`로 받은 뒤 다른 쪽이 캐시된 정적 `import()`로 한 번 헛실패하지 않게.
- 청크별 CSS 없음 확인(manifest `css` 필드 5개 키 모두 없음) — 재시도 경로가 Vite preload 래퍼(CSS 주입)를 거치지 않아도 스타일 누락 0.
- 배선 6곳: `writeBodyLoader`(`loadBoardConfirm`·`loadProfileWrites`·`loadBoardInput`) · `boardInputLoader` · `carryOverLoader` · `memoryBoardConfirm.loadCarryOver`. 자동 로더(엔진·`memoryStudio`·픽스처)는 싸지 않음(실패 시 경계 — 범위 밖).

### 3.2 번들 — 헬퍼 위치
| 시나리오 | H 뒤 | F1 뒤 (`a8c6dbf`) | 여유 |
|---|---|---|---|
| `/compare`·`(조정 있음)` | 118.78 | **118.98** (+0.20) | 6.02 |
| `/profile` | 118.61 | **118.84** (+0.23) | 6.16 |
| 공통 JS | 89.06 | 89.06 | — |
| 첫 화면 `/catalog`·`/references/:id`·`/compare`·`/profile`·`/studio` | 99.35·96.70·99.59·99.35·89.50 | 99.36·96.71·99.60·99.36·89.50 | ≥ 0.40 |
- **헬퍼는 진입 직후 closure 안에 있다**(`profileDraft` 공유 청크 — `memoryStudio`·`boardEngine`이 함께 import). 실패 **시점**에 이미 받아져 있어야 하므로 조작 뒤 청크로는 뺄 수 없다(뺀 청크가 오프라인에 실패하면 그 청크 자체가 실패 캐시에 걸린다, 2a-04b2 12.3과 같은 판단). 브리프의 "로더 파일 안 최소 코드" 쪽을 택한 것이고, 공통 JS·첫 화면은 불변 — 설계 질문 2.

### 3.3 테스트 (RED → GREEN)
- RED: 모듈 부재가 아니라 **동작 RED**를 보려고 재시도 없는 스텁(`return load`)으로 돌림 → 8건 실패 / 21 통과(`logs/f1-red-stub.txt`; 모듈 부재판 `logs/f1-red.txt`). GREEN 33/33(`logs/f1-green.txt`).
- `src/data/chunkRetry.test.ts` 6건: 성공 뒤 재요청 0 · 실패(WebKit 문장, URL 없음) → `?retry=1` 성공 · `?retry=2` 증가(두 번 연속 실패는 오류 유지) · 같은 청크 두 로더 상태 공유 · 소스에서 청크를 못 읽으면(개발·Vitest·다른 디렉터리·절대 URL) 정적 import 다시 · 겹친 호출 한 요청.
- `src/data/chunkRetryWiring.test.ts` 1건: 싼 로더 6개가 받는 모듈 = 확정 본문·쓰기 본문·`boardInput`×2·P-S25 패널·이어받기 규칙.
- 화면(브라우저 실패 캐시 흉내 `src/test/chunkFailureCache.ts` — 정적 import는 계속 실패, 소스는 빌드 출력 모양):
  - `WriteBodyLoad.test` "F1(D-2A4-01): 정적 import가 계속 실패(브라우저 실패 캐시·오류에 URL 없음) → '다시 시도'는 같은 청크를 새 URL로 — 두 번 연속 실패면 오류 유지, 세 번째에 v1"
  - `CompareBoardCarryOver.test` "F1(D-2A4-02): 정적 import가 계속 실패(브라우저 실패 캐시) → '다시 시도'는 같은 청크를 새 URL로 받아 목록"
  - `BoardInputLoad.test` "대표색: 로드 실패 …"가 미리 받기 실패 → 검사 실패 → 재시도 성공 경로를 함께 지난다.

## 4. 스모크 (Chromium · ego-browser · `vite preview` 127.0.0.1:4337 · 1280)
| 확인 | 결과 | 근거 |
|---|---|---|
| H `/compare` 진입 직후 JS 22건에 `boardInput`·`schemas` 없음 → Hero 선택 뒤 `boardInput-*.js 200`·`schemas-*.js 200` | 통과 | `logs/smoke-h-network.txt` |
| H 대표색 `abc` Enter → "대표색은 #RRGGBB 형식…" · `#c9a96e` → `#C9A96E` 저장 | 통과 | `screens/h-compare-primary-1280.png` |
| F1 D-2A4-01: `memoryBoardConfirm` 차단(`Network.setBlockedURLs`) → 확정 → "확정하지 못했습니다" → 해제 → 다시 시도 → `/profile/profile-1` | 통과 — `memoryBoardConfirm-*.js status=0` → `…js?retry=1 status=200` | `logs/smoke-f1-confirm.txt` · `screens/f1-confirm-blocked-1280.png`·`f1-confirm-retry-ok-1280.png` |
| F1 D-2A4-02: 조정 v2 뒤 보드 → `carryOverPanel` 차단 → "이어받기 확인" → "불러오지 못했습니다" → 해제 → 다시 시도 → "이어지는 조정 1개 · 지워지는 조정 0개"(스타일 정상) | 통과 — `status=0` → `?retry=1 status=200` | `logs/smoke-f1-carryover.txt` · `screens/f1-carryover-*.png` |
| WebKit | **미실시** — 허용 도구가 Chromium뿐(Playwright·WebKit 설치 금지) | — |
- 서버 종료: preview 종료 뒤 `lsof -nP -iTCP:4337 -sTCP:LISTEN` 출력 없음, exit 1 (2026-09-27 00:28:23 KST, `logs/server-stop.txt`). TaskSpace 28 `finish({ keep: [] })`.

## 5. G — 스타일 가드 범위 (N-Q4 A)
- `noHardcodedStyle.test.ts`: `src/styles/**/*.css` 중 제외 목록 밖을 검사 대상에 더함(새 CSS는 자동 대상). 명시 제외 `STYLE_EXCLUDED = ["tokens/", "theme.css"]`(토큰 원본 — `base.css` 포함 — · 토큰→Tailwind 테마 연결). styles/의 테스트 파일은 대상 밖.
- 새 테스트 "src/styles의 컴포넌트용 CSS가 대상이고, 제외 목록 항목은 실제로 있다(낡은 목록 방지)" — `versionDiff.css` 포함·제외 항목 존재·제외 경로가 대상에 없음.
- 순서: 임시 `src/styles/redProbe.css`(`#123456`·`12px`)를 둔 채 **옛 가드 통과**(빈틈, `logs/g-before-probe-old-guard.txt`) → 새 가드 **RED** 2건 검출(`logs/g-red.txt`) → 임시 파일 삭제 → **GREEN** 3/3(`logs/g-green.txt`). `versionDiff.css` 기존 위반 0(`@media` px 없음, `max-md` 변형만).

## 6. 검증
- 게이트 4종: `typecheck`·`lint`·`build`(번들 검사 포함) exit 0 — `logs/gates.txt` · 테스트는 아래 5회.
- 전체 테스트 **5회 연속** 725/725, exit 0 ×5 — `logs/test-run-1..5.txt`.
- 최종 번들(`logs/gates.txt`): 공통 89.06 · `/catalog` 99.36 / 101.75 · `/references/:id` 96.71 / 99.10 · `/compare`·`(조정 있음)` 99.60 / 118.98 · `/profile` 99.36 / 118.84 · `/studio` 89.50 / 91.89.
- Codex 리뷰: 7절.

## 7. Codex 리뷰 (`review --wait --scope branch --base 3c4d5c7`, 1회)
- Developer 실행이 세션 한도(429, 108턴)로 중단돼 **Jarvis가 실행·기입**(원문 `logs/codex-review-r1.txt`). 결과 P2 1 · P3 1(원문에 같은 항목이 두 번 출력됨).
- [P2] `chunkRetry.ts:18` 정적 의존 청크 실패는 복구되지 않음 → **8절 위험 2와 같은 내용, 영환님 HR-4 A(한계로 기록)** — 반영 안 함.
- [P3] `check-bundle-size.mjs:75` `/profile` afterAction 목록의 `boardInput`은 프로필 화면에서 불리지 않음(보고 줄만 과대, 예산 판정 영향 없음) → **FIX-2A04B2-P1에서 정리**(브리프 1절 6).

## 8. 남은 위험
1. **WebKit 미실측** — 방식은 오류 문장과 무관(로더 소스에서 URL)이라 적용되지만, WebKit이 실패한 모듈을 캐시하는지·`?retry=` 모듈이 정상 평가되는지는 확인하지 못했다(L2).
2. **하위 청크 실패는 복구되지 않는다** — 재시도 대상의 정적 의존 청크(예: `carryOverPanel` → `profileAdjustments`, `boardInput`·`memoryProfileAdjust` → zod `schemas`)가 실패하면 그 URL은 그대로라 계속 실패한다. H로 zod `schemas`가 조작 뒤 의존 청크가 되어 **선택 저장·대표색·조정 저장 경로도 이 범위에 들어왔다**.
3. **빌드 출력 모양 의존** — 청크 파일은 빌드 코드의 `import(\`./이름-해시.js\`)` 리터럴에서 읽는다. Vite/rolldown 업그레이드로 모양이 바뀌면 조용히 지금 동작(정적 재시도)으로 돌아가고 단위 테스트는 통과한다. 이를 잡는 것은 브라우저 스모크(L1)뿐 — 설계 질문 3.
4. 헬퍼의 모듈 수준 상태는 문서 수명 동안 유지(새로고침 시 초기화) — 메모리 store와 같은 수명이라 영향 없음(L2).
5. 대표색 검사 비동기 — 포커스 없이 blur만 일어나는 경로(스크립트 등)는 첫 검사 때 로드를 기다린다. 사용자 조작에서는 포커스가 늘 먼저라 실측 지연 없음.

## 9. 설계 질문 (번호로 답해 주세요)
1. **대표색 검사 청크 로드 실패 문구** — 새 실패 경로에 "대표색을 확인하지 못했습니다. 잠시 후 다시 입력하세요"(필드 오류, `aria-invalid`, 저장 0)를 넣었다. (a) 유지 (b) 문구·표시 방식 지정 (c) 로드 실패 시 필드 오류 대신 다른 표시(예: 알림 영역).
2. **F1 헬퍼의 진입 직후 비용 +0.20 / +0.23** — "로더 파일 안 최소 코드" 해석으로 진입 직후 공유 청크에 두었다(0으로는 불가 — 3.2). (a) 이대로 승인 (b) 로더별 인라인 등 다른 배치 지정.
3. **빌드 출력 모양 가드** — 위험 3을 막기 위해 `check-bundle-size.mjs`(또는 빌드 뒤 테스트)에 "조작 뒤 로더 소스에 `import(\`./<청크>-<해시>.js\`)`가 있는가" 검사를 더할지. (a) 더한다(다음 과제) (b) 스모크로 충분.
4. **하위 청크 실패** — 위험 2를 다룰지. (a) 한계로 둔다 (b) 재시도 때 의존 청크도 새 URL로 받는 방식 설계(예: 의존 청크 없는 단일 청크로 묶기 — 번들 영향 측정 필요).
5. **G 제외 목록에 `theme.css`** — 지금은 hex·px 0건이지만 "전역 기반"으로 보고 제외했다. (a) 유지 (b) 검사 대상에 넣기.
