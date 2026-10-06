# M3P-3b PROGRESS — 카드 실렌더 썸네일 연결 (ADR-004 개정 7)

base `b5ca6df` · 브랜치 `k002bill2/m3p-3b`

## 체크리스트
- [x] BRIEF P0 커밋 (`762d447`)
- [x] 1. 썸네일 21장(큐레이션 6 + 생성 15) — referenceDoc 최소 확장(상세·비교 맵 합치기), 가드 로직 변경 0, 21장 위반 0
- [x] 2. 고정 경로 `thumbs/{id}.svg` + 빌드 버전 상수(`__THUMBS_VERSION__`, `?v=`) — 키 맵·`import()`·`virtual:thumbnail-keys` 제거
- [x] 2b. check-bundle-size 가드: id 목록 ↔ dist/thumbs 파일 정확 일치 + 버전 = dist 파일 재해시 + `/catalog` 첫 화면 JS에 `.svg?v=버전` 존재
- [x] 2c. 카드: lazy img·와이어 배경·실패 복귀(AC-U6)·생성 조합 Tag 공존·버전 빈 값 → img 0
- [x] 3. 실측 → 판정: 100.05 > 99.90 → 개정 7 결정 3 적용(`routeBudgetKb`, `/catalog`만 101), 100.90 이하
- [x] 4. typecheck·lint·build·전체 vitest 1회 exit 0
- [x] 5. Ego Lite(build+preview 4337) 확인·캡처 2장·정리(finish·listTaskSpaces=[]·서버 종료·리슨 0)
- [x] 6. Codex review --scope branch --base b5ca6df — R1 지적 0(R2 불필요)
- [x] 7. REPORT

## 설계 메모
- "썸네일 없는 id는 img 0": 키 맵이 없어 카드가 id별로 판단할 수 없다 → **런타임 분기를 빌드 보장으로 이동**: build-thumbs가 카드 id 전체(큐레이션 ∪ 생성)가 썸네일 대상에 다 드는지 확인(빠지면 실패), check-bundle-size가 id 목록 ↔ 파일 정확 일치. 카드는 버전 빈 값(dev·테스트·render·thumbs 모드) → img 0.
- 서브에이전트 0(브리프).

## TDD 예측·RED 기록
> 정직 표기: 아래 예측은 각 RED 실행 직전에 정했고 PROGRESS 기록은 실행 직후 묶어 적었다. RED 상태는 커밋하지 않았다(tip = GREEN).

### A. thumbnail.test (21장)
- 예측: 3 FAIL — ① 렌더 입력(생성 id `썸네일 렌더 입력 없음` throw) ② 결정성(`key` 필드가 아직 있음 → keys = id·key·svg) ③ 대상 목록(`thumbnailIds` = 6개). 나머지 통과.
- RED: 3 FAIL / 12 pass (예측 일치) → referenceDoc 맵 합치기 + entry 대상 = 카드 id 전체 + `key` 제거 → GREEN 20/20(thumbs 3파일). 21장 모두 가드 위반 0 → 엔진·계약 변경 불필요(멈춤 조건 아님).

### B. thumbsVersion · thumbnailSrc · ReferenceCard 썸네일 4건
- 예측: thumbsVersion.test·thumbnailSrc.test = 모듈 없음 FAIL, 카드 새 4건 중 img를 찾는 3건 FAIL·"버전 빈 값 → img 0" 1건은 현재 카드(img 없음)로 통과.
- RED: 2 파일 import 실패 + 카드 3 FAIL (예측 일치) → GREEN 51/51.
- 첫 빌드에서 가드 ③ 실패: 기본 매개변수 `version = __THUMBS_VERSION__`이 접히지 않아 번들에 `t=\`76d49eca\``로 남음(가드가 실제로 잡음). 정의 상수를 본문에서 직접 쓰도록 수정 → `e=>\`/thumbs/${e}.svg?v=76d49eca\`` 한 줄, 가드 통과. 테스트는 `vi.stubGlobal("__THUMBS_VERSION__")`(vitest는 define을 전역으로 둔다 — 빈 값 단언으로 확인).
- 패치 테스트 4건 갱신: src 기대값 `/thumbs/{KEY}.svg` → `/thumbs/{id}.svg?v=버전`, "키 맵에 id 없음/키 맵 못 받음" → "버전 빈 값 → img 0"(id 누락은 빌드 보장으로 이동: thumbnail.test 대상 = 카드 id 21 · check-bundle-size id ↔ 파일). 4번째(생성 조합)는 base에 이미 있어 "img와 생성 조합 Tag 공존" 테스트로 바꿔 추가. 나머지 단언(lazy·async·absolute·와이어 role 해제·라이선스 aria-hidden·이름 있는 그림 1개·실패 복귀·알림·콘솔 0) 그대로.

### C. bundleBudget routeBudgetKb (개정 7 결정 3)
- 예측: 새 1건 FAIL(시나리오 첫 화면 한도 무시 → /page 100.50 > 100 실패 줄이 더 나옴).
- RED: 1 FAIL (예측 일치) → GREEN 20/20(scripts). `ROUTE_BUDGET_KB` = 100 단언 포함.

## 실측 표 (`npm run build` → check-bundle-size, KB gzip)
| 시나리오 | base b5ca6df 첫 화면 | M3P-3b 첫 화면 | 한도 | base 진입 | M3P-3b 진입 | 진입 한도·멈춤선 |
|---|---|---|---|---|---|---|
| /catalog | 99.89 | **100.05** | 100 → **101**(개정 7) · 멈춤선 100.90 | 102.27 | 102.43 | 125 |
| /references/:id | 97.30 | 97.30 | 100 | 99.68 | 99.69 | 125 |
| /compare (·조정 있음) | 98.86 | 98.86 | 100 | 121.96 | 121.96 | 125 · 124.70 |
| /profile | 99.72 | 99.72 | 100 | 119.19 | 119.18 | 125 |
| /profile (3안 있음) | 99.72 | 99.72 | 100 | 121.66 | 121.65 | 125 |
| /projects | 94.04 | 94.03 | 100 | 100.34 | 100.33 | 125 |
| /studio/:projectId | 91.79 | 91.77 | 100 | 128.65 | 128.64 | 129 · 128.70 |
| 렌더 문서 JS·CSS | 84.19 · 8.85 | 84.19 · 8.85 | 90 · 30 | | | 89.70 |
- 썸네일: base 6장 → **21장**, 버전 `76d49eca`, 가드 통과(id ↔ 파일·버전 재해시·`.svg?v=` 존재·렌더 CSS 동일·manifest 도구 0).
- 판정: 고정 경로 상쇄 뒤 /catalog 100.05 > 99.90 → **개정 7 결정 3 적용**(≤ 100.90). base 대비 +0.16. 참고: M3P-3 패치 4단계는 99.86 → 100.02(+0.16)였으나 그 안에 생성 조합 Tag(+0.04, 지금은 base에 포함)가 들어 있어 썸네일 몫은 ≈ +0.12였고, 그 패치는 img alt·className 문자열을 지연 청크로 옮겨 카드 청크 밖에 두었다. 이번은 키 맵·`import()`·`__vite__mapDeps`를 없앤 대신 img 속성 문자열이 카드 청크에 들어와 썸네일 몫 +0.16 — 고정 경로 상쇄만으로는 99.90 아래로 내려가지 않았다(ADR 배경의 "주원인 = 키 맵 청크·mapDeps" 추정은 실측과 다름).
- base 실측: `git archive b5ca6df app` → /tmp 사본(node_modules 복사)에서 `npm run build`.
- 전체 vitest: 첫 시도는 base 빌드와 병렬로 돌다 셸 cwd 리셋으로 저장소 루트에서 설정 없이 실행(`describe is not defined` 181 파일) — 무효. app에서 단독 재실행 **exit 0 · 247 파일 · 2184건 통과**.

## Ego Lite (preview 127.0.0.1:4337, taskSpace 10, 창 normal 확인, 뷰포트 1280×900 CDP 에뮬레이션, goto 1회 뒤 휠 스크롤만·새로고침 0)
- 첫 화면: 카드 21 · img 21(전부 `loading=lazy`·`decoding=async`) · 첫 src `/thumbs/ref-c.svg?v=76d49eca` · 뷰포트 안 6장 로드. 첫 카드 와이어 높이 decode 전후 229.24 = 229.24(레이아웃 이동 0).
- layout-shift 항목 4건 출처 = 헤더 nav·필터 줄·제목 행(뷰포트 에뮬레이션 전환·목록 로드 시점) — article·img 출처 0. (카드 밖 기존 동작, 이 변경 범위 아님)
- 스크롤 뒤: 21장 decode 성공 21 · 실패 0, 생성 카드 15 모두 img 로드, "생성 조합" Tag가 img 영역 안 · 바탕 rgb(255,255,255) 불투명(판독 확인 — 캡처 2), 플레이스홀더 role=img 0.
- 네트워크: 외부 요청 0, `/thumbs/` 21건, 그 밖 이미지 요청은 앱 아이콘 `/assets/*.svg`만.
- 캡처: `shots/01-catalog-1280-first-row.png`, `shots/02-catalog-1280-generated-cards.png`(첫 촬영은 clip을 문서 좌표 0으로 줘 빈 영역 — clip y=scrollY로 같은 파일 재촬영).
- 정리: `finish({keep:[]})` → `listTaskSpaces()` = [] · preview 종료 · 4337 리슨 0. main 5480·영환님 창 무접촉.
